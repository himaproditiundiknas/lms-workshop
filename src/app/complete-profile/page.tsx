import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { syncSupabaseUserToDatabase } from "@/lib/auth/sync-user";
import { CompleteProfileForm } from "./profile-form";

export default async function CompleteProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const email = user.email.toLowerCase();

  let appUser = await prisma.user.findUnique({
    where: {
      email,
    },
    include: {
      profile: true,
    },
  });

  if (!appUser) {
    appUser = await syncSupabaseUserToDatabase(user);
  }

  if (appUser.profile?.profileCompletedAt) {
    redirect("/redeem-invitation");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium text-slate-500">Langkah 1 dari 2</p>
          <h1 className="text-2xl font-semibold text-slate-950">
            Lengkapi Profil
          </h1>
          <p className="text-sm text-slate-600">
            Lengkapi data wajib sebelum redeem kode undangan workshop.
          </p>
        </div>

        <CompleteProfileForm
          email={email}
          initialValues={{
            fullName: appUser.profile?.fullName ?? "",
            nim: appUser.profile?.nim ?? "",
            programStudy: appUser.profile?.programStudy ?? "",
            semester: appUser.profile?.semester ?? "",
            phone: appUser.profile?.phone ?? "",
          }}
        />
      </section>
    </main>
  );
}
