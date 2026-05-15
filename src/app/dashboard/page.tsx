import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { calculateCertificateEligibility } from "@/lib/certificate/eligibility";

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(date);
}

function ProgressBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));

  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-slate-950"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function StatusBadge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "emerald" | "red" | "amber" | "blue";
}) {
  const classNameByTone = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${classNameByTone[tone]}`}
    >
      {children}
    </span>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: user.email.toLowerCase(),
    },
    include: {
      profile: true,
    },
  });

  if (!appUser) {
    redirect("/login");
  }

  if (!appUser.profile?.profileCompletedAt) {
    redirect("/complete-profile");
  }

  const approvedEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId: appUser.id,
      status: "APPROVED",
      cohortId: {
        not: null,
      },
    },
    orderBy: {
      approvedAt: "desc",
    },
    include: {
      cohort: {
        include: {
          workshop: true,
        },
      },
    },
  });

  if (!approvedEnrollment?.cohortId || !approvedEnrollment.cohort) {
    const pendingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: appUser.id,
        status: "PENDING",
      },
      include: {
        cohort: {
          include: {
            workshop: true,
          },
        },
      },
    });

    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Participant Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Belum Bisa Akses Dashboard
              </h1>
            </div>

            <LogoutButton />
          </div>

          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            {pendingEnrollment ? (
              <>
                <p className="font-medium">Enrollment kamu masih pending.</p>
                <p className="mt-2">
                  Workshop:{" "}
                  {pendingEnrollment.cohort?.workshop.title ?? "Workshop"}
                </p>
                <p className="mt-1">
                  Cohort: {pendingEnrollment.cohort?.name ?? "-"}
                </p>
                <p className="mt-2">
                  Tunggu admin approve enrollment kamu dulu ya.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">
                  Kamu belum punya enrollment approved.
                </p>
                <p className="mt-2">
                  Redeem invitation code dulu untuk masuk workshop/cohort.
                </p>
              </>
            )}
          </div>

          <div className="mt-6">
            <Link
              href="/redeem-invitation"
              className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Redeem Invitation
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const cohortId = approvedEnrollment.cohortId;
  const cohort = approvedEnrollment.cohort;
  const workshop = cohort.workshop;
  const workshopId = cohort.workshopId;

  const [
    sessions,
    presentAttendances,
    nextSession,
    activeAssignments,
    latestModules,
    projectGroupMember,
    certificateEligibility,
  ] = await Promise.all([
    prisma.session.findMany({
      where: {
        cohortId,
      },
      orderBy: {
        meetingNo: "asc",
      },
      select: {
        id: true,
      },
    }),
    prisma.attendance.findMany({
      where: {
        userId: appUser.id,
        session: {
          cohortId,
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
    }),
    prisma.session.findFirst({
      where: {
        cohortId,
        startsAt: {
          gte: new Date(),
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      include: {
        cohort: true,
      },
    }),
    prisma.assignment.findMany({
      where: {
        workshopId,
        status: "PUBLISHED",
      },
      orderBy: [
        {
          dueAt: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 5,
      include: {
        submissions: {
          where: {
            userId: appUser.id,
            isLatest: true,
          },
          orderBy: {
            attemptNo: "desc",
          },
          take: 1,
          include: {
            projectGroup: true,
          },
        },
      },
    }),
    prisma.module.findMany({
      where: {
        workshopId,
        status: "PUBLISHED",
      },
      orderBy: [
        {
          updatedAt: "desc",
        },
        {
          orderNo: "asc",
        },
      ],
      take: 4,
      include: {
        materials: {
          where: {
            status: "PUBLISHED",
          },
          orderBy: {
            orderNo: "asc",
          },
          take: 3,
        },
      },
    }),
    prisma.projectGroupMember.findFirst({
      where: {
        userId: appUser.id,
        cohortId,
      },
      include: {
        projectGroup: {
          include: {
            mentor: {
              include: {
                profile: true,
              },
            },
            members: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
              orderBy: [
                {
                  role: "asc",
                },
                {
                  joinedAt: "asc",
                },
              ],
            },
          },
        },
      },
    }),
    calculateCertificateEligibility({
      userId: appUser.id,
      cohortId,
    }),
  ]);

  const totalSessions = sessions.length;
  const attendedSessionIds = new Set(
    presentAttendances.map((attendance) => attendance.sessionId),
  );
  const presentCount = attendedSessionIds.size;
  const attendancePercentage =
    totalSessions === 0 ? 0 : Math.round((presentCount / totalSessions) * 100);

  const openAssignments = activeAssignments.filter((assignment) => {
    const latestSubmission = assignment.submissions[0];

    return !latestSubmission || latestSubmission.status === "REOPENED";
  });

  const submittedAssignments = activeAssignments.filter((assignment) => {
    const latestSubmission = assignment.submissions[0];

    return latestSubmission && latestSubmission.status !== "REOPENED";
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Participant Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Halo, {appUser.profile.fullName}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Ringkasan progress workshop kamu.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/materials"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Materials
              </Link>
              <Link
                href="/assignments"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Assignments
              </Link>
              <Link
                href="/attendance/scan"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Scan QR
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Workshop</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {workshop.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">{cohort.name}</p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Attendance</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {presentCount}/{totalSessions} sesi
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {attendancePercentage}% hadir
            </p>
            <div className="mt-4">
              <ProgressBar value={attendancePercentage} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Assignments</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {submittedAssignments.length}/{activeAssignments.length} submitted
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {openAssignments.length} masih perlu dikerjakan
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Certificate</p>
            <div className="mt-3">
              <StatusBadge
                tone={
                  certificateEligibility.status === "ELIGIBLE"
                    ? "emerald"
                    : "red"
                }
              >
                {certificateEligibility.status}
              </StatusBadge>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Final project pass:{" "}
              {certificateEligibility.finalProject.passedCount}/
              {certificateEligibility.finalProject.requiredCount}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Next Session
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Sesi terdekat dari cohort kamu.
                  </p>
                </div>

                <Link
                  href="/attendance/scan"
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Scan QR
                </Link>
              </div>

              {nextSession ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Meeting #{nextSession.meetingNo}
                      </p>
                      <h3 className="mt-1 text-xl font-semibold text-slate-950">
                        {nextSession.title}
                      </h3>
                      {nextSession.description ? (
                        <p className="mt-2 text-sm text-slate-600">
                          {nextSession.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-sm text-slate-700 md:text-right">
                      <p>{formatDateTime(nextSession.startsAt)}</p>
                      <p className="mt-1">
                        Ends: {formatDateTime(nextSession.endsAt)}
                      </p>
                      {nextSession.location ? (
                        <p className="mt-1">Lokasi: {nextSession.location}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Belum ada jadwal sesi berikutnya.
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Active Assignments
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Assignment published yang bisa kamu kerjakan.
                  </p>
                </div>

                <Link
                  href="/assignments"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  View All
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {activeAssignments.map((assignment) => {
                  const latestSubmission = assignment.submissions[0];

                  return (
                    <div
                      key={assignment.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">
                              {assignment.title}
                            </h3>
                            <StatusBadge
                              tone={
                                assignment.category === "FINAL_PROJECT"
                                  ? "blue"
                                  : "slate"
                              }
                            >
                              {assignment.category}
                            </StatusBadge>
                            {latestSubmission ? (
                              <StatusBadge
                                tone={
                                  latestSubmission.status === "GRADED"
                                    ? "emerald"
                                    : "amber"
                                }
                              >
                                {latestSubmission.status}
                              </StatusBadge>
                            ) : (
                              <StatusBadge tone="red">
                                NOT_SUBMITTED
                              </StatusBadge>
                            )}
                          </div>

                          <p className="mt-2 text-sm text-slate-600">
                            Due: {formatDateTime(assignment.dueAt)}
                          </p>

                          {latestSubmission?.score !== null &&
                          latestSubmission?.score !== undefined ? (
                            <p className="mt-1 text-sm text-slate-600">
                              Score: {latestSubmission.score}/100
                            </p>
                          ) : null}

                          {latestSubmission?.projectGroup ? (
                            <p className="mt-1 text-sm text-slate-600">
                              Group: {latestSubmission.projectGroup.name}
                            </p>
                          ) : null}
                        </div>

                        <Link
                          href={`/assignments/${assignment.id}/submit`}
                          className="rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          {latestSubmission ? "Lihat / Resubmit" : "Submit"}
                        </Link>
                      </div>
                    </div>
                  );
                })}

                {activeAssignments.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Belum ada active assignment.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Project Group
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Status group final project kamu.
              </p>

              {projectGroupMember ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-950">
                      {projectGroupMember.projectGroup.name}
                    </h3>
                    <StatusBadge>
                      {projectGroupMember.projectGroup.status}
                    </StatusBadge>
                    <StatusBadge tone="blue">
                      {projectGroupMember.role}
                    </StatusBadge>
                  </div>

                  {projectGroupMember.projectGroup.title ? (
                    <p className="mt-2 text-sm font-medium text-slate-700">
                      {projectGroupMember.projectGroup.title}
                    </p>
                  ) : null}

                  <p className="mt-2 text-sm text-slate-600">
                    Mentor:{" "}
                    {projectGroupMember.projectGroup.mentor
                      ? (projectGroupMember.projectGroup.mentor.profile
                          ?.fullName ??
                        projectGroupMember.projectGroup.mentor.email)
                      : "-"}
                  </p>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-950">
                      Members
                    </p>
                    <ul className="mt-2 space-y-2">
                      {projectGroupMember.projectGroup.members.map((member) => (
                        <li
                          key={member.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="text-slate-700">
                            {member.user.profile?.fullName ?? member.user.email}
                          </span>
                          <StatusBadge>{member.role}</StatusBadge>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                  Kamu belum masuk project group.
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Latest Materials
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Materi terbaru dari workshop.
                  </p>
                </div>

                <Link
                  href="/materials"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  View
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {latestModules.map((module) => (
                  <div
                    key={module.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="text-xs font-medium text-slate-500">
                      Module {module.orderNo}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-950">
                      {module.title}
                    </h3>

                    {module.description ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {module.description}
                      </p>
                    ) : null}

                    {module.materials.length > 0 ? (
                      <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-600">
                        {module.materials.map((material) => (
                          <li key={material.id}>{material.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">
                        Belum ada material published.
                      </p>
                    )}
                  </div>
                ))}

                {latestModules.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Belum ada materi published.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Certificate Status
              </h2>
              <div className="mt-3">
                <StatusBadge
                  tone={
                    certificateEligibility.status === "ELIGIBLE"
                      ? "emerald"
                      : "red"
                  }
                >
                  {certificateEligibility.status}
                </StatusBadge>
              </div>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <p>
                  Attendance: {certificateEligibility.attendance.presentCount}/
                  {certificateEligibility.attendance.totalSessions} sesi (
                  {certificateEligibility.attendance.percentage}%)
                </p>
                <p>
                  Required assignments:{" "}
                  {certificateEligibility.assignments.submittedRequiredCount}/
                  {certificateEligibility.assignments.requiredCount}
                </p>
                <p>
                  Final project passed:{" "}
                  {certificateEligibility.finalProject.passedCount}/
                  {certificateEligibility.finalProject.requiredCount}
                </p>
              </div>

              {certificateEligibility.reasons.length > 0 ? (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <p className="font-medium">Belum eligible karena:</p>
                  <ul className="mt-2 list-inside list-disc space-y-1">
                    {certificateEligibility.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Semua syarat sertifikat sudah terpenuhi.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
