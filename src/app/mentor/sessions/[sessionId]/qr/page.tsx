import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { QrDisplay } from "./qr-display";

type SessionQrPageProps = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function SessionQrPage({ params }: SessionQrPageProps) {
  await requireMentorOrAdmin();

  const { sessionId } = await params;

  const session = await prisma.session.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      cohort: {
        include: {
          workshop: true,
        },
      },
    },
  });

  if (!session) {
    notFound();
  }

  if (session.attendanceStatus !== "OPEN") {
    redirect("/mentor/sessions");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          href="/mentor/sessions"
          className="text-sm font-medium text-slate-600 hover:text-slate-950"
        >
          ← Kembali ke daftar sesi
        </Link>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-700">
            Attendance Open
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {session.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {session.cohort.workshop.title} — {session.cohort.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Meeting #{session.meetingNo}
          </p>
        </div>

        <QrDisplay sessionId={session.id} />
      </section>
    </main>
  );
}
