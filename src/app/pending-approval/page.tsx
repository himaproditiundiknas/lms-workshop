import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

export default async function PendingApprovalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: user.email.toLowerCase(),
    },
    include: {
      enrollments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  const latestEnrollment = appUser?.enrollments[0];

  if (!latestEnrollment) {
    redirect("/redeem-invitation");
  }

  if (latestEnrollment.status === "APPROVED") {
    redirect(`/workshops/${latestEnrollment.targetId}`);
  }

  if (latestEnrollment.status === "REJECTED") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-red-700">Rejected</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            Pendaftaran Ditolak
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Enrollment kamu ditolak. Silakan hubungi admin untuk informasi lebih
            lanjut.
          </p>

          {latestEnrollment.rejectionReason ? (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-medium">Alasan:</p>
              <p className="mt-1">{latestEnrollment.rejectionReason}</p>
            </div>
          ) : null}

          <div className="mt-6">
            <LogoutButton />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-amber-700">Pending Approval</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Pendaftaran Menunggu Persetujuan
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Kode undangan berhasil digunakan. Enrollment kamu sedang menunggu
          approval admin sebelum bisa mengakses workshop.
        </p>

        <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <span className="font-medium">Scope:</span> {latestEnrollment.scope}
          </p>
          <p className="mt-1 break-all">
            <span className="font-medium">Target ID:</span>{" "}
            {latestEnrollment.targetId}
          </p>
          <p className="mt-1">
            <span className="font-medium">Status:</span>{" "}
            {latestEnrollment.status}
          </p>
        </div>

        <div className="mt-6">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
