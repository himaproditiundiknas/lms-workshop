import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { calculateCertificateEligibility } from "@/lib/certificate/eligibility";

type AdminCertificateEligibilityPageProps = {
  searchParams: Promise<{
    cohort?: string;
    status?: string;
  }>;
};

function StatusBadge({ status }: { status: "ELIGIBLE" | "NOT_ELIGIBLE" }) {
  if (status === "ELIGIBLE") {
    return (
      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
        ELIGIBLE
      </span>
    );
  }

  return (
    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
      NOT_ELIGIBLE
    </span>
  );
}

export default async function AdminCertificateEligibilityPage({
  searchParams,
}: AdminCertificateEligibilityPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const cohortFilter = params.cohort?.trim();
  const statusFilter = params.status?.trim();

  const [cohorts, approvedEnrollments] = await Promise.all([
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
    prisma.enrollment.findMany({
      where: {
        status: "APPROVED",
        cohortId: {
          not: null,
        },
        ...(cohortFilter
          ? {
              cohortId: cohortFilter,
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
  ]);

  const eligibilityRows = await Promise.all(
    approvedEnrollments
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

  const filteredRows = eligibilityRows.filter((row) => {
    if (!statusFilter) {
      return true;
    }

    return row.eligibility.status === statusFilter;
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Certificate Eligibility
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Kelayakan Sertifikat
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Hitung eligibility berdasarkan attendance, required assignment,
                dan final project score.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/mentor/final-projects"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Final Projects
              </Link>
              <Link
                href="/mentor/submissions?latest=latest"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Submissions
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <select
              name="cohort"
              defaultValue={cohortFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.workshop.title} — {cohort.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua status</option>
              <option value="ELIGIBLE">Eligible</option>
              <option value="NOT_ELIGIBLE">Not eligible</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>

            <Link
              href="/admin/certificates"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4 font-medium">Participant</th>
                  <th className="py-3 pr-4 font-medium">Cohort</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Attendance</th>
                  <th className="py-3 pr-4 font-medium">
                    Required Assignments
                  </th>
                  <th className="py-3 pr-4 font-medium">Final Project</th>
                  <th className="py-3 pr-4 font-medium">Reasons</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ enrollment, eligibility }) => (
                  <tr key={enrollment.id} className="border-b last:border-0">
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

                    <td className="py-4 pr-4 align-top text-sm text-slate-700">
                      <p className="font-medium text-slate-950">
                        {enrollment.cohort?.workshop.title ?? "-"}
                      </p>
                      <p className="mt-1">{enrollment.cohort?.name ?? "-"}</p>
                    </td>

                    <td className="py-4 pr-4 align-top">
                      <StatusBadge status={eligibility.status} />
                    </td>

                    <td className="py-4 pr-4 align-top text-sm text-slate-700">
                      <p>
                        {eligibility.attendance.presentCount}/
                        {eligibility.attendance.totalSessions} sesi
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {eligibility.attendance.percentage}% / minimal{" "}
                        {eligibility.attendance.minimumPercentage}%
                      </p>
                    </td>

                    <td className="py-4 pr-4 align-top text-sm text-slate-700">
                      <p>
                        {eligibility.assignments.submittedRequiredCount}/
                        {eligibility.assignments.requiredCount} submitted
                      </p>

                      {eligibility.assignments.missingRequiredAssignments
                        .length > 0 ? (
                        <ul className="mt-2 list-inside list-disc text-xs text-red-700">
                          {eligibility.assignments.missingRequiredAssignments.map(
                            (assignment) => (
                              <li key={assignment.id}>
                                {assignment.title} ({assignment.category})
                              </li>
                            ),
                          )}
                        </ul>
                      ) : null}
                    </td>

                    <td className="py-4 pr-4 align-top text-sm text-slate-700">
                      <p>
                        Passed: {eligibility.finalProject.passedCount}/
                        {eligibility.finalProject.requiredCount}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Min score: {eligibility.finalProject.minimumScore}
                      </p>

                      {eligibility.finalProject.items.length > 0 ? (
                        <ul className="mt-2 space-y-1 text-xs">
                          {eligibility.finalProject.items.map((item) => (
                            <li key={item.assignmentId}>
                              {item.title}:{" "}
                              {item.submitted ? item.status : "NOT_SUBMITTED"} ·
                              score {item.score ?? "-"} ·{" "}
                              {item.passed ? "PASS" : "NOT_PASS"}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>

                    <td className="py-4 pr-4 align-top">
                      {eligibility.reasons.length > 0 ? (
                        <ul className="list-inside list-disc text-xs text-red-700">
                          {eligibility.reasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-emerald-700">
                          Semua syarat terpenuhi.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      Belum ada data eligibility.
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
