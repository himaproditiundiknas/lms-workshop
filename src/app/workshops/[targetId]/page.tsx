import { requireApprovedWorkshopEnrollment } from "@/lib/enrollment/require-approved-workshop-enrollment";

type WorkshopPageProps = {
  params: Promise<{
    targetId: string;
  }>;
};

export default async function WorkshopPage({ params }: WorkshopPageProps) {
  const { targetId } = await params;

  await requireApprovedWorkshopEnrollment(targetId);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">
          Workshop Detail
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Kamu sudah approved untuk mengakses workshop ini.
        </p>
      </section>
    </main>
  );
}
