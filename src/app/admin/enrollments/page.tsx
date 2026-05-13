import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { EnrollmentActions } from "./enrollment-actions";

type AdminEnrollmentsPageProps = {
  searchParams: Promise<{
    workshop?: string;
  }>;
};

export default async function AdminEnrollmentsPage({
  searchParams,
}: AdminEnrollmentsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const workshopFilter = params.workshop?.trim();

  const enrollments = await prisma.enrollment.findMany({
    where: {
      status: "PENDING",
      ...(workshopFilter
        ? {
            targetId: workshopFilter,
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
      invitationCode: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">
                Pending Enrollments
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Approve atau reject peserta yang sudah redeem kode undangan.
              </p>
            </div>

            <LogoutButton />
          </div>

          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              name="workshop"
              type="text"
              defaultValue={workshopFilter}
              placeholder="Filter by workshop/cohort target UUID"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>
            <a
              href="/admin/enrollments"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </a>
          </form>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white p-6 shadow-sm">
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
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id} className="border-b last:border-0">
                  <td className="py-4 pr-4 align-top">
                    <p className="font-medium text-slate-950">
                      {enrollment.user.profile?.fullName ?? "-"}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {enrollment.user.email}
                    </p>
                  </td>

                  <td className="py-4 pr-4 align-top text-xs text-slate-700">
                    <p>NIM: {enrollment.user.profile?.nim ?? "-"}</p>
                    <p className="mt-1">
                      Prodi: {enrollment.user.profile?.programStudy ?? "-"}
                    </p>
                    <p className="mt-1">
                      Semester: {enrollment.user.profile?.semester ?? "-"}
                    </p>
                    <p className="mt-1">
                      WA: {enrollment.user.profile?.phone ?? "-"}
                    </p>
                  </td>

                  <td className="py-4 pr-4 align-top">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {enrollment.scope}
                    </span>
                  </td>

                  <td className="py-4 pr-4 align-top font-mono text-xs text-slate-600">
                    {enrollment.targetId}
                  </td>

                  <td className="py-4 pr-4 align-top text-slate-700">
                    {new Intl.DateTimeFormat("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(enrollment.createdAt)}
                  </td>

                  <td className="py-4 pr-4 align-top">
                    <EnrollmentActions
                      enrollmentId={enrollment.id}
                      scope={enrollment.scope}
                    />
                  </td>
                </tr>
              ))}

              {enrollments.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-10 text-center text-sm text-slate-500"
                  >
                    Tidak ada enrollment pending.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
