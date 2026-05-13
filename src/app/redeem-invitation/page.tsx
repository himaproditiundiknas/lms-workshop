import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { RedeemInvitationForm } from "./redeem-form";

export default async function RedeemInvitationPage() {
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
      profile: true,
      enrollments: {
        where: {
          status: "PENDING",
        },
        take: 1,
      },
    },
  });

  if (!appUser?.profile?.profileCompletedAt) {
    redirect("/complete-profile");
  }

  if (appUser.enrollments.length > 0) {
    redirect("/pending-approval");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Langkah 2 dari 2</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Redeem Kode Undangan
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Masukkan kode undangan yang diberikan admin untuk mendaftar workshop.
        </p>

        <div className="mt-8">
          <RedeemInvitationForm />
        </div>
      </section>
    </main>
  );
}
