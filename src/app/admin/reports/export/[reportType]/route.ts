import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import {
  createCsvResponse,
  createEmptyCsvResponse,
  formatDateTime,
  type CsvRow,
} from "@/lib/report/csv";
import { calculateCertificateEligibility } from "@/lib/certificate/eligibility";
import { createAuditLog, toAuditMetadata } from "@/lib/audit/audit-log";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type ReportType =
  | "participants"
  | "attendance"
  | "submissions"
  | "grades"
  | "certificate-eligibility";

type ExportRouteContext = {
  params: Promise<{
    reportType: string;
  }>;
};

const REPORT_TYPES: ReportType[] = [
  "participants",
  "attendance",
  "submissions",
  "grades",
  "certificate-eligibility",
];

function isReportType(value: string): value is ReportType {
  return REPORT_TYPES.includes(value as ReportType);
}

function getFilters(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  return {
    workshopId: searchParams.get("workshopId")?.trim() || undefined,
    cohortId: searchParams.get("cohortId")?.trim() || undefined,
  };
}

function buildFilename(reportType: ReportType) {
  const date = new Date().toISOString().slice(0, 10);

  return `${reportType}-${date}.csv`;
}

function getWorkshopCohortWhere(filters: {
  workshopId?: string;
  cohortId?: string;
}) {
  return {
    ...(filters.cohortId
      ? {
          cohortId: filters.cohortId,
        }
      : {}),
    ...(filters.workshopId
      ? {
          cohort: {
            workshopId: filters.workshopId,
          },
        }
      : {}),
  };
}

async function writeExportAuditLog({
  actorUserId,
  reportType,
  workshopId,
  cohortId,
  rowCount,
}: {
  actorUserId: string;
  reportType: ReportType;
  workshopId?: string;
  cohortId?: string;
  rowCount: number;
}) {
  await createAuditLog({
    actorUserId,
    action: "report.exported",
    entityType: "report",
    entityId: randomUUID(),
    metadata: toAuditMetadata({
      reportType,
      workshopId: workshopId ?? null,
      cohortId: cohortId ?? null,
      rowCount,
      exportedAt: new Date().toISOString(),
    }),
  });
}

async function exportParticipants(filters: {
  workshopId?: string;
  cohortId?: string;
}) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      ...getWorkshopCohortWhere(filters),
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      user: {
        include: {
          profile: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
      },
      cohort: {
        include: {
          workshop: true,
        },
      },
    },
  });

  return enrollments.map<CsvRow>((enrollment) => ({
    enrollment_id: enrollment.id,
    user_id: enrollment.userId,
    email: enrollment.user.email,
    full_name: enrollment.user.profile?.fullName ?? "",
    nim: enrollment.user.profile?.nim ?? "",
    program_study: enrollment.user.profile?.programStudy ?? "",
    semester: enrollment.user.profile?.semester ?? "",
    phone: enrollment.user.profile?.phone ?? "",
    roles: enrollment.user.roles
      .map((userRole) => userRole.role.name)
      .join("|"),
    workshop_id: enrollment.cohort?.workshopId ?? "",
    workshop_title: enrollment.cohort?.workshop.title ?? "",
    cohort_id: enrollment.cohortId ?? "",
    cohort_name: enrollment.cohort?.name ?? "",
    enrollment_scope: enrollment.scope,
    enrollment_status: enrollment.status,
    approved_at: formatDateTime(enrollment.approvedAt),
    rejected_at: formatDateTime(enrollment.rejectedAt),
    rejection_reason: enrollment.rejectionReason ?? "",
    created_at: formatDateTime(enrollment.createdAt),
  }));
}

async function exportAttendance(filters: {
  workshopId?: string;
  cohortId?: string;
}) {
  const attendances = await prisma.attendance.findMany({
    where: {
      session: {
        ...(filters.cohortId
          ? {
              cohortId: filters.cohortId,
            }
          : {}),
        ...(filters.workshopId
          ? {
              cohort: {
                workshopId: filters.workshopId,
              },
            }
          : {}),
      },
    },
    orderBy: {
      checkedInAt: "desc",
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      session: {
        include: {
          cohort: {
            include: {
              workshop: true,
            },
          },
        },
      },
      recordedBy: {
        select: {
          email: true,
        },
      },
      correctedBy: {
        select: {
          email: true,
        },
      },
    },
  });

  return attendances.map<CsvRow>((attendance) => ({
    attendance_id: attendance.id,
    user_id: attendance.userId,
    email: attendance.user.email,
    full_name: attendance.user.profile?.fullName ?? "",
    nim: attendance.user.profile?.nim ?? "",
    workshop_id: attendance.session.cohort.workshopId,
    workshop_title: attendance.session.cohort.workshop.title,
    cohort_id: attendance.session.cohortId,
    cohort_name: attendance.session.cohort.name,
    session_id: attendance.sessionId,
    meeting_no: attendance.session.meetingNo,
    session_title: attendance.session.title,
    attendance_status: attendance.status,
    attendance_method: attendance.method,
    checked_in_at: formatDateTime(attendance.checkedInAt),
    recorded_by: attendance.recordedBy?.email ?? "",
    corrected_at: formatDateTime(attendance.correctedAt),
    corrected_by: attendance.correctedBy?.email ?? "",
    correction_reason: attendance.note ?? "",
    note: attendance.note ?? "",
    created_at: formatDateTime(attendance.createdAt),
  }));
}

async function exportSubmissions(filters: {
  workshopId?: string;
  cohortId?: string;
}) {
  const submissions = await prisma.submission.findMany({
    where: {
      assignment: {
        ...(filters.workshopId
          ? {
              workshopId: filters.workshopId,
            }
          : {}),
      },
      ...(filters.cohortId
        ? {
            OR: [
              {
                user: {
                  enrollments: {
                    some: {
                      cohortId: filters.cohortId,
                      status: "APPROVED",
                    },
                  },
                },
              },
              {
                projectGroup: {
                  cohortId: filters.cohortId,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      submittedAt: "desc",
    },
    include: {
      assignment: {
        include: {
          workshop: true,
        },
      },
      user: {
        include: {
          profile: true,
        },
      },
      projectGroup: true,
      files: true,
    },
  });

  return submissions.map<CsvRow>((submission) => ({
    submission_id: submission.id,
    assignment_id: submission.assignmentId,
    assignment_title: submission.assignment.title,
    assignment_category: submission.assignment.category,
    workshop_id: submission.assignment.workshopId,
    workshop_title: submission.assignment.workshop.title,
    project_group_id: submission.projectGroupId ?? "",
    project_group_name: submission.projectGroup?.name ?? "",
    user_id: submission.userId,
    email: submission.user.email,
    full_name: submission.user.profile?.fullName ?? "",
    nim: submission.user.profile?.nim ?? "",
    attempt_no: submission.attemptNo,
    is_latest: submission.isLatest,
    status: submission.status,
    repository_url: submission.repositoryUrl ?? "",
    deployment_url: submission.deploymentUrl ?? "",
    files: submission.files.map((file) => file.fileUrl).join("|"),
    content_text: submission.contentText ?? "",
    submitted_at: formatDateTime(submission.submittedAt),
    score: submission.score ?? "",
    feedback: submission.feedback ?? "",
    graded_at: formatDateTime(submission.gradedAt),
    reopened_at: formatDateTime(submission.reopenedAt),
    reopen_reason: submission.reopenReason ?? "",
    created_at: formatDateTime(submission.createdAt),
  }));
}

async function exportGrades(filters: {
  workshopId?: string;
  cohortId?: string;
}) {
  const submissions = await prisma.submission.findMany({
    where: {
      isLatest: true,
      status: "GRADED",
      assignment: {
        ...(filters.workshopId
          ? {
              workshopId: filters.workshopId,
            }
          : {}),
      },
      ...(filters.cohortId
        ? {
            OR: [
              {
                user: {
                  enrollments: {
                    some: {
                      cohortId: filters.cohortId,
                      status: "APPROVED",
                    },
                  },
                },
              },
              {
                projectGroup: {
                  cohortId: filters.cohortId,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: {
      gradedAt: "desc",
    },
    include: {
      assignment: {
        include: {
          workshop: true,
        },
      },
      user: {
        include: {
          profile: true,
        },
      },
      projectGroup: true,
      gradedBy: {
        select: {
          email: true,
        },
      },
    },
  });

  return submissions.map<CsvRow>((submission) => ({
    submission_id: submission.id,
    assignment_id: submission.assignmentId,
    assignment_title: submission.assignment.title,
    assignment_category: submission.assignment.category,
    workshop_id: submission.assignment.workshopId,
    workshop_title: submission.assignment.workshop.title,
    project_group_id: submission.projectGroupId ?? "",
    project_group_name: submission.projectGroup?.name ?? "",
    user_id: submission.userId,
    email: submission.user.email,
    full_name: submission.user.profile?.fullName ?? "",
    nim: submission.user.profile?.nim ?? "",
    attempt_no: submission.attemptNo,
    score: submission.score ?? "",
    feedback: submission.feedback ?? "",
    graded_at: formatDateTime(submission.gradedAt),
    graded_by: submission.gradedBy?.email ?? "",
  }));
}

async function exportCertificateEligibility(filters: {
  workshopId?: string;
  cohortId?: string;
}) {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "APPROVED",
      cohortId: {
        not: null,
      },
      ...getWorkshopCohortWhere(filters),
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      cohort: {
        include: {
          workshop: true,
        },
      },
    },
  });

  const rows = await Promise.all(
    enrollments
      .filter((enrollment) => enrollment.cohortId && enrollment.cohort)
      .map(async (enrollment) => {
        const eligibility = await calculateCertificateEligibility({
          userId: enrollment.userId,
          cohortId: enrollment.cohortId as string,
        });

        return {
          enrollment,
          eligibility,
        };
      }),
  );

  return rows.map<CsvRow>(({ enrollment, eligibility }) => ({
    user_id: enrollment.userId,
    email: enrollment.user.email,
    full_name: enrollment.user.profile?.fullName ?? "",
    nim: enrollment.user.profile?.nim ?? "",
    workshop_id: enrollment.cohort?.workshopId ?? "",
    workshop_title: enrollment.cohort?.workshop.title ?? "",
    cohort_id: enrollment.cohortId ?? "",
    cohort_name: enrollment.cohort?.name ?? "",
    eligibility_status: eligibility.status,
    reasons: eligibility.reasons.join("|"),
    attendance_present_count: eligibility.attendance.presentCount,
    attendance_total_sessions: eligibility.attendance.totalSessions,
    attendance_percentage: eligibility.attendance.percentage,
    attendance_minimum_percentage: eligibility.attendance.minimumPercentage,
    required_assignment_count: eligibility.assignments.requiredCount,
    submitted_required_assignment_count:
      eligibility.assignments.submittedRequiredCount,
    missing_required_assignments:
      eligibility.assignments.missingRequiredAssignments
        .map((assignment) => assignment.title)
        .join("|"),
    final_project_required_count: eligibility.finalProject.requiredCount,
    final_project_submitted_count: eligibility.finalProject.submittedCount,
    final_project_passed_count: eligibility.finalProject.passedCount,
    final_project_minimum_score: eligibility.finalProject.minimumScore,
    final_project_items: eligibility.finalProject.items
      .map(
        (item) =>
          `${item.title}:${item.status ?? "NOT_SUBMITTED"}:${item.score ?? "-"}`,
      )
      .join("|"),
  }));
}

async function getRows(
  reportType: ReportType,
  filters: {
    workshopId?: string;
    cohortId?: string;
  },
) {
  if (reportType === "participants") {
    return exportParticipants(filters);
  }

  if (reportType === "attendance") {
    return exportAttendance(filters);
  }

  if (reportType === "submissions") {
    return exportSubmissions(filters);
  }

  if (reportType === "grades") {
    return exportGrades(filters);
  }

  return exportCertificateEligibility(filters);
}

function getEmptyHeaders(reportType: ReportType) {
  if (reportType === "participants") {
    return [
      "enrollment_id",
      "user_id",
      "email",
      "full_name",
      "nim",
      "program_study",
      "semester",
      "phone",
      "roles",
      "workshop_id",
      "workshop_title",
      "cohort_id",
      "cohort_name",
      "enrollment_scope",
      "enrollment_status",
      "approved_at",
      "rejected_at",
      "rejection_reason",
      "created_at",
    ];
  }

  if (reportType === "attendance") {
    return [
      "attendance_id",
      "user_id",
      "email",
      "full_name",
      "nim",
      "workshop_id",
      "workshop_title",
      "cohort_id",
      "cohort_name",
      "session_id",
      "meeting_no",
      "session_title",
      "attendance_status",
      "attendance_method",
      "checked_in_at",
      "recorded_by",
      "corrected_at",
      "corrected_by",
      "correction_reason",
      "note",
      "created_at",
    ];
  }

  if (reportType === "submissions") {
    return [
      "submission_id",
      "assignment_id",
      "assignment_title",
      "assignment_category",
      "workshop_id",
      "workshop_title",
      "project_group_id",
      "project_group_name",
      "user_id",
      "email",
      "full_name",
      "nim",
      "attempt_no",
      "is_latest",
      "status",
      "repository_url",
      "deployment_url",
      "files",
      "content_text",
      "submitted_at",
      "score",
      "feedback",
      "graded_at",
      "reopened_at",
      "reopen_reason",
      "created_at",
    ];
  }

  if (reportType === "grades") {
    return [
      "submission_id",
      "assignment_id",
      "assignment_title",
      "assignment_category",
      "workshop_id",
      "workshop_title",
      "project_group_id",
      "project_group_name",
      "user_id",
      "email",
      "full_name",
      "nim",
      "attempt_no",
      "score",
      "feedback",
      "graded_at",
      "graded_by",
    ];
  }

  return [
    "user_id",
    "email",
    "full_name",
    "nim",
    "workshop_id",
    "workshop_title",
    "cohort_id",
    "cohort_name",
    "eligibility_status",
    "reasons",
    "attendance_present_count",
    "attendance_total_sessions",
    "attendance_percentage",
    "attendance_minimum_percentage",
    "required_assignment_count",
    "submitted_required_assignment_count",
    "missing_required_assignments",
    "final_project_required_count",
    "final_project_submitted_count",
    "final_project_passed_count",
    "final_project_minimum_score",
    "final_project_items",
  ];
}

export async function GET(request: NextRequest, context: ExportRouteContext) {
  const actor = await requireMentorOrAdmin();
  const { reportType: rawReportType } = await context.params;

  // Rate limit CSV exports per user
  const rateLimitResult = checkRateLimit(actor.id, RATE_LIMITS.csvExport);

  if (!rateLimitResult.allowed) {
    return new Response("Terlalu banyak export. Coba lagi nanti.", {
      status: 429,
    });
  }

  if (!isReportType(rawReportType)) {
    return new Response("Report type tidak valid.", {
      status: 400,
    });
  }

  const filters = getFilters(request);
  const rows = await getRows(rawReportType, filters);

  await writeExportAuditLog({
    actorUserId: actor.id,
    reportType: rawReportType,
    workshopId: filters.workshopId,
    cohortId: filters.cohortId,
    rowCount: rows.length,
  });

  const filename = buildFilename(rawReportType);

  if (rows.length === 0) {
    return createEmptyCsvResponse(filename, getEmptyHeaders(rawReportType));
  }

  return createCsvResponse(filename, rows);
}
