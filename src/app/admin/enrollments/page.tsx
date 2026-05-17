import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { approveEnrollmentAction, rejectEnrollmentAction } from "./actions";

type AdminEnrollmentsPageProps = {
  searchParams: Promise<{
    target?: string;
    success?: string;
    error?: string;
  }>;
};

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getAllowedCohortsForEnrollment({
  enrollmentScope,
  targetId,
  cohorts,
}: {
  enrollmentScope: string;
  targetId: string;
  cohorts: Array<{
    id: string;
    name: string;
    workshopId: string;
    workshop: {
      title: string;
    };
  }>;
}) {
  if (enrollmentScope === "WORKSHOP") {
    return cohorts.filter((cohort) => cohort.workshopId === targetId);
  }

  if (enrollmentScope === "COHORT") {
    return cohorts.filter((cohort) => cohort.id === targetId);
  }

  return [];
}

export default async function AdminEnrollmentsPage({
  searchParams,
}: AdminEnrollmentsPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const targetFilter = params.target?.trim();
  const successMessage = params.success?.trim();
  const errorMessage = params.error?.trim();

  const [pendingEnrollments, cohorts] = await Promise.all([
    prisma.enrollment.findMany({
      where: {
        status: "PENDING",
        ...(targetFilter
          ? {
              targetId: targetFilter,
            }
          : {}),
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
    }),
    prisma.cohort.findMany({
      orderBy: [
        {
          workshop: {
            title: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      include: {
        workshop: {
          select: {
            title: true,
          },
        },
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
                Admin Enrollment
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Pending Enrollments
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Approve atau reject peserta yang sudah redeem kode undangan.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Admin Dashboard
              </Link>
              <LogoutButton />
            </div>
          </div>

          {successMessage ? (
            <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <form className="mt-6 flex flex-col gap-3 lg:flex-row">
            <input
              name="target"
              defaultValue={targetFilter ?? ""}
              placeholder="Filter by workshop/cohort target UUID"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>
            <Link
              href="/admin/enrollments"
              className="rounded-lg border border-slate-300 px-5 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4 font-medium">Participant</th>
                  <th className="py-3 pr-4 font-medium">Profile</th>
                  <th className="py-3 pr-4 font-medium">Scope</th>
                  <th className="py-3 pr-4 font-medium">Target</th>
                  <th className="py-3 pr-4 font-medium">Redeemed At</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {pendingEnrollments.map((enrollment) => {
                  const allowedCohorts = getAllowedCohortsForEnrollment({
                    enrollmentScope: enrollment.scope,
                    targetId: enrollment.targetId,
                    cohorts,
                  });

                  const targetCohort =
                    enrollment.scope === "COHORT"
                      ? cohorts.find(
                          (cohort) => cohort.id === enrollment.targetId,
                        )
                      : null;

                  return (
                    <tr key={enrollment.id} className="border-b last:border-0">
                      <td className="py-5 pr-4 align-top">
                        <p className="font-medium text-slate-950">
                          {enrollment.user.profile?.fullName ?? "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {enrollment.user.email}
                        </p>
                      </td>

                      <td className="py-5 pr-4 align-top text-sm text-slate-700">
                        <p>NIM: {enrollment.user.profile?.nim ?? "-"}</p>
                        <p>
                          Prodi: {enrollment.user.profile?.programStudy ?? "-"}
                        </p>
                        <p>
                          Semester: {enrollment.user.profile?.semester ?? "-"}
                        </p>
                        <p>WA: {enrollment.user.profile?.phone ?? "-"}</p>
                      </td>

                      <td className="py-5 pr-4 align-top">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {enrollment.scope}
                        </span>
                      </td>

                      <td className="py-5 pr-4 align-top">
                        <p className="break-all font-mono text-xs text-slate-700">
                          {enrollment.targetId}
                        </p>

                        {enrollment.scope === "COHORT" && targetCohort ? (
                          <p className="mt-2 text-xs text-slate-500">
                            {targetCohort.workshop.title} — {targetCohort.name}
                          </p>
                        ) : null}

                        {enrollment.scope === "WORKSHOP" ? (
                          <p className="mt-2 text-xs text-slate-500">
                            Pilih cohort saat approve.
                          </p>
                        ) : null}
                      </td>

                      <td className="py-5 pr-4 align-top text-sm text-slate-700">
                        {formatDateTime(enrollment.createdAt)}
                      </td>

                      <td className="py-5 pr-4 align-top">
                        <div className="space-y-3">
                          <form
                            action={approveEnrollmentAction}
                            className="space-y-2"
                          >
                            <input
                              type="hidden"
                              name="enrollmentId"
                              value={enrollment.id}
                            />

                            {enrollment.scope === "WORKSHOP" ? (
                              <select
                                name="cohortId"
                                defaultValue=""
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                                required
                              >
                                <option value="">Pilih cohort</option>
                                {allowedCohorts.map((cohort) => (
                                  <option key={cohort.id} value={cohort.id}>
                                    {cohort.workshop.title} — {cohort.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <>
                                <input
                                  type="hidden"
                                  name="cohortId"
                                  value={enrollment.targetId}
                                />
                                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                                  {targetCohort
                                    ? `${targetCohort.workshop.title} — ${targetCohort.name}`
                                    : "Target cohort tidak ditemukan"}
                                </div>
                              </>
                            )}

                            {enrollment.scope === "WORKSHOP" &&
                            allowedCohorts.length === 0 ? (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                Belum ada cohort untuk workshop ini. Buat cohort
                                dulu sebelum approve.
                              </div>
                            ) : null}

                            <button
                              type="submit"
                              disabled={
                                enrollment.scope === "WORKSHOP" &&
                                allowedCohorts.length === 0
                              }
                              className="rounded-lg bg-slate-950 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              Approve
                            </button>
                          </form>

                          <form
                            action={rejectEnrollmentAction}
                            className="space-y-2"
                          >
                            <input
                              type="hidden"
                              name="enrollmentId"
                              value={enrollment.id}
                            />
                            <input
                              name="reason"
                              placeholder="Alasan reject opsional"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-red-200 px-4 py-2 text-xs font-medium text-red-700 transition hover:bg-red-50"
                            >
                              Reject
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {pendingEnrollments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
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
      </section>
    </main>
  );
}
