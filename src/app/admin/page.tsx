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

function formatMetadata(metadata: unknown) {
  if (!metadata) {
    return "-";
  }

  if (typeof metadata === "string") {
    return metadata;
  }

  try {
    return JSON.stringify(metadata);
  } catch {
    return "-";
  }
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
  tone = "slate",
}: {
  label: string;
  value: string | number;
  helper: string;
  href: string;
  tone?: "slate" | "red" | "emerald" | "amber" | "blue";
}) {
  const borderByTone = {
    slate: "border-slate-200",
    red: "border-red-200",
    emerald: "border-emerald-200",
    amber: "border-amber-200",
    blue: "border-blue-200",
  };

  const content = (
    <div
      className={`rounded-2xl border ${borderByTone[tone]} bg-white p-5 shadow-sm transition hover:shadow-md`}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );

  return <Link href={href}>{content}</Link>;
}

export default async function AdminDashboardPage() {
  await requireMentorOrAdmin();

  const now = new Date();

  const [
    pendingEnrollmentCount,
    approvedParticipantCount,
    totalSessionCount,
    openSessionCount,
    publishedAssignmentCount,
    pendingSubmissionCount,
    activeProjectGroupCount,
    certificateEligibleCount,
    certificateNotEligibleCount,
    upcomingSessions,
    recentPendingEnrollments,
    recentActivities,
  ] = await Promise.all([
    prisma.enrollment.count({
      where: {
        status: "PENDING",
      },
    }),
    prisma.enrollment.count({
      where: {
        status: "APPROVED",
      },
    }),
    prisma.session.count(),
    prisma.session.count({
      where: {
        attendanceStatus: "OPEN",
      },
    }),
    prisma.assignment.count({
      where: {
        status: "PUBLISHED",
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
    prisma.projectGroup.count({
      where: {
        status: "ACTIVE",
      },
    }),
    prisma.auditLog.count({
      where: {
        action: "certificate.eligible",
      },
    }),
    prisma.auditLog.count({
      where: {
        action: "certificate.not_eligible",
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
    prisma.enrollment.findMany({
      where: {
        status: "PENDING",
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 6,
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
    }),
    prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Admin Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Ringkasan Operasional Admin
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Pantau enrollment, peserta, sesi, laporan, dan aktivitas terbaru
                dari satu halaman.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/enrollments"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Review Enrollments
              </Link>
              <Link
                href="/admin/reports"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Reports
              </Link>
              <Link
                href="/mentor"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Mentor Dashboard
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending Enrollments"
            value={pendingEnrollmentCount}
            helper="Enrollment yang perlu approval"
            href="/admin/enrollments"
            tone={pendingEnrollmentCount > 0 ? "red" : "emerald"}
          />
          <StatCard
            label="Approved Participants"
            value={approvedParticipantCount}
            helper="Peserta yang sudah approved"
            href="/admin/enrollments"
            tone="blue"
          />
          <StatCard
            label="Total Sessions"
            value={totalSessionCount}
            helper={`${openSessionCount} attendance sedang open`}
            href="/mentor/sessions"
            tone="slate"
          />
          <StatCard
            label="Pending Submissions"
            value={pendingSubmissionCount}
            helper="Submission latest yang perlu review"
            href="/mentor/submissions?latest=latest"
            tone={pendingSubmissionCount > 0 ? "amber" : "emerald"}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Pending Enrollments
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Enrollment pending dibuat mudah ditemukan untuk admin.
                  </p>
                </div>

                <Link
                  href="/admin/enrollments"
                  className="rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  Open Approval Page
                </Link>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-3 pr-4 font-medium">Participant</th>
                      <th className="py-3 pr-4 font-medium">Workshop</th>
                      <th className="py-3 pr-4 font-medium">Cohort</th>
                      <th className="py-3 pr-4 font-medium">Created</th>
                      <th className="py-3 pr-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPendingEnrollments.map((enrollment) => (
                      <tr
                        key={enrollment.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-4 pr-4 align-top">
                          <p className="font-medium text-slate-950">
                            {enrollment.user.profile?.fullName ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {enrollment.user.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            NIM: {enrollment.user.profile?.nim ?? "-"}
                          </p>
                        </td>

                        <td className="py-4 pr-4 align-top text-slate-700">
                          {enrollment.cohort?.workshop.title ?? "-"}
                        </td>

                        <td className="py-4 pr-4 align-top text-slate-700">
                          {enrollment.cohort?.name ?? "-"}
                        </td>

                        <td className="py-4 pr-4 align-top text-xs text-slate-600">
                          {formatDateTime(enrollment.createdAt)}
                        </td>

                        <td className="py-4 pr-4 align-top">
                          <Link
                            href="/admin/enrollments"
                            className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}

                    {recentPendingEnrollments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-10 text-center text-sm text-slate-500"
                        >
                          Tidak ada pending enrollment.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Upcoming Sessions
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Sesi terdekat dari semua cohort.
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
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Report Shortcuts
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Akses cepat ke export dan monitoring report.
              </p>

              <div className="mt-5 grid gap-3">
                <Link
                  href="/admin/reports"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">Export Reports</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Download CSV participants, attendance, submissions, grades,
                    dan eligibility.
                  </p>
                </Link>

                <Link
                  href="/admin/certificates"
                  className="rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-950">
                    Certificate Eligibility
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Cek kelayakan sertifikat berdasarkan attendance, assignment,
                    dan final project.
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
                    Pantau progress submission final project per group/member.
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
                    Review, reopen, grade, dan beri feedback submission.
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
                    {publishedAssignmentCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Active project groups</span>
                  <span className="font-semibold text-slate-950">
                    {activeProjectGroupCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Open attendance sessions</span>
                  <span className="font-semibold text-slate-950">
                    {openSessionCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Certificate eligible audit count</span>
                  <span className="font-semibold text-slate-950">
                    {certificateEligibleCount}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Certificate not eligible audit count</span>
                  <span className="font-semibold text-slate-950">
                    {certificateNotEligibleCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Recent Activities
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Aktivitas terbaru dari audit log.
              </p>

              <div className="mt-5 space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone="blue">{activity.action}</StatusBadge>
                      <StatusBadge>{activity.entityType}</StatusBadge>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatDateTime(activity.createdAt)}
                    </p>

                    <p className="mt-2 line-clamp-3 break-all text-xs text-slate-600">
                      {formatMetadata(activity.metadata)}
                    </p>
                  </div>
                ))}

                {recentActivities.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    Belum ada aktivitas.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
