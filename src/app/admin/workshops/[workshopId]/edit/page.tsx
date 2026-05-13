import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { WorkshopForm } from "../../workshop-form";

type EditWorkshopPageProps = {
  params: Promise<{
    workshopId: string;
  }>;
};

export default async function EditWorkshopPage({
  params,
}: EditWorkshopPageProps) {
  await requireAdmin();

  const { workshopId } = await params;

  const workshop = await prisma.workshop.findUnique({
    where: {
      id: workshopId,
    },
  });

  if (!workshop) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <Link
          href="/admin/workshops"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Kembali ke Workshop
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold text-slate-950">
            Edit Workshop
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Perbarui detail workshop.
          </p>
        </div>

        <div className="mt-6">
          <WorkshopForm
            mode="edit"
            workshopId={workshop.id}
            initialValues={{
              title: workshop.title,
              slug: workshop.slug,
              description: workshop.description ?? "",
              status: workshop.status,
            }}
          />
        </div>
      </section>
    </main>
  );
}
