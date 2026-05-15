import type { ReactNode } from "react";
import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
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

function StatCard({
  label,
  value,
  helper,
  href,
}: {
  label: string;
  value: string | number;
  helper: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}

export default async function MentorDashboardPage() {
  await requireMentorOrAdmin();

  const now = new Date();

  const [
    approvedParticipantCount,
    pendingSubmissionCount,
    upcomingSessions,
    openAttendanceSessions,
    recentSubmissions,
    pendingEnrollmentCount,
    activeAssignmentCount,
    activeProjectGroupCount,
  ] = await Promise.all([
    prisma.enrollment.count({
      where: {
        status: "APPROVED",
      },
    }),
    prisma.submission.count({
      where: {
        isLatest: true,
        status: {
          in: ["SUBMITTED", "LATE"],
        },
      },
    }),
    prisma.session.findMany({
      where: {
        startsAt: {
          gte: now,
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      take: 5,
      include: {
        cohort: {
          include: {
            workshop: true,
          },
        },
      },
    }),
    prisma.session.findMany({
      where: {
        attendanceStatus: "OPEN",
      },
      orderBy: {
        startsAt: "asc",
      },
      take: 5,
      include: {
        cohort: {
          include: {
            workshop: true,
          },
        },
      },
    }),
    prisma.submission.findMany({
      where: {
        isLatest: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 8,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        assignment: {
          include: {
            workshop: true,
          },
        },
        projectGroup: true,
      },
    }),
    prisma.enrollment.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.assignment.count({
      where: {
        status: "PUBLISHED",
      },
    }),
    prisma.projectGroup.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Mentor Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Ringkasan Operasional Mentor
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Pantau sesi, submission, peserta, dan aksi penting dari satu
                halaman.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/mentor/sessions"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Sessions
              </Link>
              <Link
                href="/mentor/submissions?latest=latest"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Submissions
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Reports
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Approved Participants"
            value={approvedParticipantCount}
            helper="Peserta yang sudah approved"
            href="/admin/enrollments"
          />
          <StatCard
            label="Pending Submissions"
            value={pendingSubmissionCount}
            helper="Submission latest yang perlu review"
            href="/mentor/submissions?latest=latest&status=SUBMITTED"
          />
          <StatCard
            label="Pending Enrollments"
            value={pendingEnrollmentCount}
            helper="Enrollment yang perlu approval"
            href="/admin/enrollments"
          />
          <StatCard
            label="Active Groups"
            value={activeProjectGroupCount}
            helper="Project group aktif"
            href="/mentor/project-groups"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Upcoming Sessions
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Sesi terdekat yang akan berjalan.
                  </p>
                </div>

                <Link
                  href="/mentor/sessions"
                  className="rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Manage Sessions
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-500">
                          {session.cohort?.workshop.title ?? "Workshop"} —{" "}
                          {session.cohort?.name ?? "Cohort"}
                        </p>
                        <h3 className="mt-1 font-semibold text-slate-950">
                          Meeting #{session.meetingNo}: {session.title}
                        </h3>
                        {session.description ? (
                          <p className="mt-2 text-sm text-slate-600">
                            {session.description}
                          </p>
                        ) : null}
                      </div>

                      <div className="text-sm text-slate-700 md:text-right">
                        <p>{formatDateTime(session.startsAt)}</p>
                        <p className="mt-1">
                          Ends: {formatDateTime(session.endsAt)}
                        </p>
                        {session.location ? (
                          <p className="mt-1">Lokasi: {session.location}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={
                          session.attendanceStatus === "OPEN"
                            ? "emerald"
                            : "slate"
                        }
                      >
                        Attendance {session.attendanceStatus}
                      </StatusBadge>

                      <Link
                        href={`/mentor/sessions/${session.id}/qr`}
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        QR Page
                      </Link>

                      <Link
                        href={`/mentor/sessions/${session.id}/edit`}
                        className="text-xs font-medium text-blue-700 hover:underline"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}

                {upcomingSessions.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Belum ada upcoming session.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Recent Submissions
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Submission terbaru dari peserta.
                  </p>
                </div>

                <Link
                  href="/mentor/submissions?latest=latest"
                  className="rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Review Submissions
                </Link>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-3 pr-4 font-medium">Participant</th>
                      <th className="py-3 pr-4 font-medium">Assignment</th>
                      <th className="py-3 pr-4 font-medium">Status</th>
                      <th className="py-3 pr-4 font-medium">Attempt</th>
                      <th className="py-3 pr-4 font-medium">Submitted</th>
                      <th className="py-3 pr-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSubmissions.map((submission) => (
                      <tr
                        key={submission.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-4 pr-4 align-top">
                          <p className="font-medium text-slate-950">
                            {submission.user.profile?.fullName ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {submission.user.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            NIM: {submission.user.profile?.nim ?? "-"}
                          </p>
                        </td>

                        <td className="py-4 pr-4 align-top">
                          <p className="font-medium text-slate-950">
                            {submission.assignment.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {submission.assignment.workshop.title}
                          </p>
                          {submission.projectGroup ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Group: {submission.projectGroup.name}
                            </p>
                          ) : null}
                        </td>

                        <td className="py-4 pr-4 align-top">
                          <StatusBadge
                            tone={
                              submission.status === "GRADED"
                                ? "emerald"
                                : submission.status === "REOPENED"
                                  ? "amber"
                                  : "blue"
                            }
                          >
                            {submission.status}
                          </StatusBadge>
                        </td>

                        <td className="py-4 pr-4 align-top text-slate-700">
                          #{submission.attemptNo}
                        </td>

                        <td className="py-4 pr-4 align-top text-xs text-slate-700">
                          {formatDateTime(submission.submittedAt)}
                        </td>

                        <td className="py-4 pr-4 align-top">
                          <Link
                            href={`/mentor/submissions/${submission.id}`}
                            className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {recentSubmissions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-10 text-center text-sm text-slate-500"
                        >
                          Belum ada submission.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Attendance Open Sessions
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Sesi yang presensinya sedang dibuka.
              </p>

              <div className="mt-5 space-y-3">
                {openAttendanceSessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                  >
                    <p className="text-xs font-medium text-emerald-700">
                      {session.cohort?.workshop.title ?? "Workshop"} —{" "}
                      {session.cohort?.name ?? "Cohort"}
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-950">
                      Meeting #{session.meetingNo}: {session.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-700">
                      {formatDateTime(session.startsAt)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/mentor/sessions/${session.id}/qr`}
                        className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        Show QR
                      </Link>
                      <Link
                        href="/mentor/attendance"
                        className="rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                      >
                        Attendance Page
                      </Link>
                    </div>
                  </div>
                ))}

                {openAttendanceSessions.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Tidak ada attendance session yang sedang open.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Quick Actions
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Shortcut operasional yang sering dipakai mentor/admin.
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/mentor/sessions"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">Manage Sessions</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Buka/tutup presensi, QR, dan jadwal sesi.
                  </p>
                </Link>

                <Link
                  href="/mentor/assignments"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">
                    Manage Assignments
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Buat assignment, publish, dan monitor tugas aktif.
                  </p>
                </Link>

                <Link
                  href="/mentor/submissions?latest=latest"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">
                    Review Submissions
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Reopen, grade, dan beri feedback submission.
                  </p>
                </Link>

                <Link
                  href="/mentor/final-projects"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">
                    Final Project Progress
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Pantau progress submission final project per group.
                  </p>
                </Link>

                <Link
                  href="/mentor/project-groups"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">Project Groups</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Kelola group, member, dan mentor final project.
                  </p>
                </Link>

                <Link
                  href="/admin/reports"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">Export Reports</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Download CSV participants, attendance, submissions, grades.
                  </p>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Operational Summary
              </h2>

              <div className="mt-5 space-y-3 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-4">
                  <span>Published assignments</span>
                  <span className="font-semibold text-slate-950">
                    {activeAssignmentCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Pending submissions</span>
                  <span className="font-semibold text-slate-950">
                    {pendingSubmissionCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Open attendance sessions</span>
                  <span className="font-semibold text-slate-950">
                    {openAttendanceSessions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Upcoming sessions shown</span>
                  <span className="font-semibold text-slate-950">
                    {upcomingSessions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
