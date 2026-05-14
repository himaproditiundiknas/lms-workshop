import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { SessionForm } from "../../session-form";

type EditSessionPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

function toDateTimeLocalValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export default async function EditSessionPage({
  params,
}: EditSessionPageProps) {
  await requireAdmin();

  const { sessionId } = await params;

  const [session, cohorts] = await Promise.all([
    prisma.session.findUnique({
      where: {
        id: sessionId,
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

  if (!session) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <Link
          href="/admin/sessions"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Kembali ke Sessions
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold text-slate-950">Edit Sesi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Perbarui detail sesi/pertemuan.
          </p>
        </div>

        <div className="mt-6">
          <SessionForm
            mode="edit"
            sessionId={session.id}
            cohorts={cohorts}
            initialValues={{
              cohortId: session.cohortId,
              meetingNo: session.meetingNo,
              title: session.title,
              description: session.description ?? "",
              location: session.location ?? "",
              startsAt: toDateTimeLocalValue(session.startsAt),
              endsAt: toDateTimeLocalValue(session.endsAt),
            }}
          />
        </div>
      </section>
    </main>
  );
}
