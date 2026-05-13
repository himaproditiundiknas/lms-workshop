import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { AttendanceQrScanner } from "./qr-scanner";

export default async function AttendanceScanPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Participant Attendance
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Scan QR Presensi
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Arahkan kamera ke QR presensi yang ditampilkan mentor.
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <AttendanceQrScanner />
      </section>
    </main>
  );
}
