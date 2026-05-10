import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CompleteProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">
          Lengkapi Profil
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          Akun Google kamu sudah berhasil login. Selanjutnya lengkapi profil
          sebelum lanjut ke tahap berikutnya.
        </p>
      </section>
    </main>
  );
}
