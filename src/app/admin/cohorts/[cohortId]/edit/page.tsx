import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { CohortForm } from "../../cohort-form";

type EditCohortPageProps = {
  params: Promise<{
    cohortId: string;
  }>;
};

function toDateTimeLocalValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export default async function EditCohortPage({ params }: EditCohortPageProps) {
  await requireAdmin();

  const { cohortId } = await params;

  const [cohort, workshops] = await Promise.all([
    prisma.cohort.findUnique({
      where: {
        id: cohortId,
      },
    }),
    prisma.workshop.findMany({
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  if (!cohort) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <Link
          href="/admin/cohorts"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Kembali ke Cohort
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold text-slate-950">Edit Cohort</h1>
          <p className="mt-1 text-sm text-slate-600">Perbarui data cohort.</p>
        </div>

        <div className="mt-6">
          <CohortForm
            mode="edit"
            cohortId={cohort.id}
            workshops={workshops}
            initialValues={{
              workshopId: cohort.workshopId,
              name: cohort.name,
              slug: cohort.slug,
              status: cohort.status,
              startsAt: toDateTimeLocalValue(cohort.startsAt),
              endsAt: toDateTimeLocalValue(cohort.endsAt),
            }}
          />
        </div>
      </section>
    </main>
  );
}
