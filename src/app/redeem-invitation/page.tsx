import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

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
    },
  });

  if (!appUser?.profile?.profileCompletedAt) {
    redirect("/complete-profile");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Langkah 2 dari 2</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Redeem Kode Undangan
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Profil kamu sudah lengkap. Form redeem kode undangan akan
          diimplementasikan di issue berikutnya.
        </p>
      </section>
    </main>
  );
}
