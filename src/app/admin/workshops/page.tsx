import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { WorkshopForm } from "./workshop-form";

export default async function AdminWorkshopsPage() {
  await requireAdmin();

  const workshops = await prisma.workshop.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          cohorts: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">
            Buat Workshop
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Tambahkan workshop baru untuk program LMS.
          </p>

          <div className="mt-6">
            <WorkshopForm mode="create" />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Workshop List
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Kelola workshop dan cohort terkait.
              </p>
            </div>

            <LogoutButton />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4 font-medium">Title</th>
                  <th className="py-3 pr-4 font-medium">Slug</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Cohorts</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {workshops.map((workshop) => (
                  <tr key={workshop.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {workshop.title}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-slate-600">
                      {workshop.slug}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {workshop.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {workshop._count.cohorts}
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/workshops/${workshop.id}/edit`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}

                {workshops.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      Belum ada workshop.
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
