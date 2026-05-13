import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { CohortForm } from "./cohort-form";

export default async function AdminCohortsPage() {
  await requireAdmin();

  const [workshops, cohorts] = await Promise.all([
    prisma.workshop.findMany({
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.cohort.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        workshop: true,
        _count: {
          select: {
            sessions: true,
            enrollments: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Buat Cohort</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tambahkan batch/cohort untuk workshop.
          </p>

          <div className="mt-6">
            <CohortForm mode="create" workshops={workshops} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Cohort List
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Kelola cohort dan hubungannya ke workshop.
              </p>
            </div>

            <LogoutButton />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4 font-medium">Cohort</th>
                  <th className="py-3 pr-4 font-medium">Workshop</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Sessions</th>
                  <th className="py-3 pr-4 font-medium">Enrollments</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((cohort) => (
                  <tr key={cohort.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-950">
                        {cohort.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-slate-500">
                        {cohort.slug}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {cohort.workshop.title}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {cohort.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {cohort._count.sessions}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {cohort._count.enrollments}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/cohorts/${cohort.id}/edit`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}

                {cohorts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Belum ada cohort.
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
