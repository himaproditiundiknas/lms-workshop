import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <section className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Dashboard</h1>
        <p className="mt-3 text-sm text-slate-600">
          Login berhasil. Halaman ini menjadi placeholder untuk next required
          step setelah profil lengkap.
        </p>
        <a
          href="/attendance/scan"
          className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Scan QR Presensi
        </a>
        <div className="mt-6">
          <LogoutButton />
        </div>
        <a
          href="/materials"
          className="mt-3 inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Lihat Materi
        </a>
      </section>
    </main>
  );
}
