import { prisma } from "@/lib/prisma";

const MIN_ATTENDANCE_PERCENT = 75;
const MIN_FINAL_PROJECT_SCORE = 70;

type CertificateEligibilityInput = {
  userId: string;
  cohortId: string;
};

type CertificateEligibilityStatus = "ELIGIBLE" | "NOT_ELIGIBLE";

export type CertificateEligibilityResult = {
  status: CertificateEligibilityStatus;
  reasons: string[];
  attendance: {
    presentCount: number;
    totalSessions: number;
    percentage: number;
    minimumPercentage: number;
  };
  assignments: {
    requiredCount: number;
    submittedRequiredCount: number;
    missingRequiredAssignments: Array<{
      id: string;
      title: string;
      category: string;
    }>;
  };
  finalProject: {
    requiredCount: number;
    submittedCount: number;
    passedCount: number;
    minimumScore: number;
    items: Array<{
      assignmentId: string;
      title: string;
      submitted: boolean;
      status: string | null;
      score: number | null;
      passed: boolean;
    }>;
  };
};

function roundPercentage(value: number) {
  return Math.round(value * 100) / 100;
}

export async function calculateCertificateEligibility({
  userId,
  cohortId,
}: CertificateEligibilityInput): Promise<CertificateEligibilityResult> {
  const reasons: string[] = [];

  const cohort = await prisma.cohort.findUnique({
    where: {
      id: cohortId,
    },
    include: {
      workshop: true,
    },
  });

  if (!cohort) {
    return {
      status: "NOT_ELIGIBLE",
      reasons: ["Cohort tidak ditemukan."],
      attendance: {
        presentCount: 0,
        totalSessions: 0,
        percentage: 0,
        minimumPercentage: MIN_ATTENDANCE_PERCENT,
      },
      assignments: {
        requiredCount: 0,
        submittedRequiredCount: 0,
        missingRequiredAssignments: [],
      },
      finalProject: {
        requiredCount: 0,
        submittedCount: 0,
        passedCount: 0,
        minimumScore: MIN_FINAL_PROJECT_SCORE,
        items: [],
      },
    };
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      cohortId,
      status: "APPROVED",
    },
  });

  if (!enrollment) {
    reasons.push("Peserta belum approved di cohort ini.");
  }

  const sessions = await prisma.session.findMany({
    where: {
      cohortId,
    },
    select: {
      id: true,
    },
  });

  const sessionIds = sessions.map((session) => session.id);

  const attendanceRecords =
    sessionIds.length > 0
      ? await prisma.attendance.findMany({
          where: {
            userId,
            sessionId: {
              in: sessionIds,
            },
            OR: [
              {
                status: "PRESENT",
              },
              {
                correctedAt: {
                  not: null,
                },
              },
            ],
          },
          select: {
            sessionId: true,
          },
        })
      : [];

  const attendedSessionIds = new Set(
    attendanceRecords.map((attendance) => attendance.sessionId),
  );

  const totalSessions = sessions.length;
  const presentCount = attendedSessionIds.size;
  const attendancePercentage =
    totalSessions === 0
      ? 0
      : roundPercentage((presentCount / totalSessions) * 100);

  if (totalSessions === 0) {
    reasons.push("Belum ada sesi pada cohort ini.");
  } else if (attendancePercentage < MIN_ATTENDANCE_PERCENT) {
    reasons.push(
      `Attendance masih ${attendancePercentage}%. Minimal ${MIN_ATTENDANCE_PERCENT}%.`,
    );
  }

  const requiredAssignments = await prisma.assignment.findMany({
    where: {
      workshopId: cohort.workshopId,
      requiredForCertificate: true,
      status: {
        in: ["PUBLISHED", "CLOSED"],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      title: true,
      category: true,
    },
  });

  const requiredAssignmentIds = requiredAssignments.map(
    (assignment) => assignment.id,
  );

  const latestRequiredSubmissions =
    requiredAssignmentIds.length > 0
      ? await prisma.submission.findMany({
          where: {
            userId,
            assignmentId: {
              in: requiredAssignmentIds,
            },
            isLatest: true,
            status: {
              in: ["SUBMITTED", "LATE", "GRADED"],
            },
          },
          select: {
            assignmentId: true,
            status: true,
            score: true,
          },
        })
      : [];

  const submittedRequiredAssignmentIds = new Set(
    latestRequiredSubmissions.map((submission) => submission.assignmentId),
  );

  const missingRequiredAssignments = requiredAssignments.filter(
    (assignment) => !submittedRequiredAssignmentIds.has(assignment.id),
  );

  if (requiredAssignments.length === 0) {
    reasons.push("Belum ada assignment required for certificate.");
  }

  if (missingRequiredAssignments.length > 0) {
    reasons.push(
      `Masih ada ${missingRequiredAssignments.length} required assignment yang belum disubmit.`,
    );
  }

  const finalProjectAssignments = requiredAssignments.filter(
    (assignment) => assignment.category === "FINAL_PROJECT",
  );

  if (finalProjectAssignments.length === 0) {
    reasons.push("Belum ada final project yang required for certificate.");
  }

  const finalProjectItems = finalProjectAssignments.map((assignment) => {
    const submission = latestRequiredSubmissions.find(
      (item) => item.assignmentId === assignment.id,
    );

    const submitted = Boolean(submission);
    const score = submission?.score ?? null;
    const passed = Boolean(score !== null && score >= MIN_FINAL_PROJECT_SCORE);

    return {
      assignmentId: assignment.id,
      title: assignment.title,
      submitted,
      status: submission?.status ?? null,
      score,
      passed,
    };
  });

  const submittedFinalProjectCount = finalProjectItems.filter(
    (item) => item.submitted,
  ).length;

  const passedFinalProjectCount = finalProjectItems.filter(
    (item) => item.passed,
  ).length;

  const missingFinalProjects = finalProjectItems.filter(
    (item) => !item.submitted,
  );

  if (missingFinalProjects.length > 0) {
    reasons.push("Final project belum disubmit.");
  }

  const unpassedFinalProjects = finalProjectItems.filter(
    (item) => item.submitted && !item.passed,
  );

  if (unpassedFinalProjects.length > 0) {
    reasons.push(
      `Final project belum memenuhi minimal score ${MIN_FINAL_PROJECT_SCORE}.`,
    );
  }

  return {
    status: reasons.length === 0 ? "ELIGIBLE" : "NOT_ELIGIBLE",
    reasons,
    attendance: {
      presentCount,
      totalSessions,
      percentage: attendancePercentage,
      minimumPercentage: MIN_ATTENDANCE_PERCENT,
    },
    assignments: {
      requiredCount: requiredAssignments.length,
      submittedRequiredCount: submittedRequiredAssignmentIds.size,
      missingRequiredAssignments: missingRequiredAssignments.map(
        (assignment) => ({
          id: assignment.id,
          title: assignment.title,
          category: assignment.category,
        }),
      ),
    },
    finalProject: {
      requiredCount: finalProjectAssignments.length,
      submittedCount: submittedFinalProjectCount,
      passedCount: passedFinalProjectCount,
      minimumScore: MIN_FINAL_PROJECT_SCORE,
      items: finalProjectItems,
    },
  };
}
