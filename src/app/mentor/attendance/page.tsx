import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { ManualCorrectionModal } from "./manual-correction-modal";

type MentorAttendancePageProps = {
  searchParams: Promise<{
    session?: string;
  }>;
};

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function MentorAttendancePage({
  searchParams,
}: MentorAttendancePageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const selectedSessionId = params.session?.trim();

  const sessions = await prisma.session.findMany({
    orderBy: [
      {
        cohort: {
          workshop: {
            title: "asc",
          },
        },
      },
      {
        cohort: {
          name: "asc",
        },
      },
      {
        meetingNo: "asc",
      },
    ],
    include: {
      cohort: {
        include: {
          workshop: true,
        },
      },
    },
  });

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ??
    sessions[0] ??
    null;

  const [approvedEnrollments, attendances] = selectedSession
    ? await Promise.all([
        prisma.enrollment.findMany({
          where: {
            cohortId: selectedSession.cohortId,
            status: "APPROVED",
          },
          orderBy: {
            createdAt: "asc",
          },
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        }),
        prisma.attendance.findMany({
          where: {
            sessionId: selectedSession.id,
          },
          include: {
            recordedBy: {
              select: {
                email: true,
              },
            },
            correctedBy: {
              select: {
                email: true,
              },
            },
          },
        }),
      ])
    : [[], []];

  const attendanceByUserId = new Map(
    attendances.map((attendance) => [attendance.userId, attendance]),
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Attendance Management
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Rekap & Koreksi Presensi
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Pilih sesi untuk melihat rekap presensi dan melakukan koreksi
                manual jika ada kendala teknis.
              </p>
            </div>

            <LogoutButton />
          </div>

          <form className="mt-6 flex flex-col gap-3 md:flex-row">
            <select
              name="session"
              defaultValue={selectedSession?.id ?? ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.cohort.workshop.title} — {session.cohort.name} —
                  Meeting #{session.meetingNo}: {session.title}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Tampilkan
            </button>

            <Link
              href="/mentor/sessions"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Kembali ke Sessions
            </Link>
          </form>
        </div>

        {selectedSession ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-500">
                {selectedSession.cohort.workshop.title} —{" "}
                {selectedSession.cohort.name}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Meeting #{selectedSession.meetingNo}: {selectedSession.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Jadwal: {formatDateTime(selectedSession.startsAt)} -{" "}
                {formatDateTime(selectedSession.endsAt)}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 pr-4 font-medium">Participant</th>
                    <th className="py-3 pr-4 font-medium">Profile</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Method</th>
                    <th className="py-3 pr-4 font-medium">Checked In</th>
                    <th className="py-3 pr-4 font-medium">Correction</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedEnrollments.map((enrollment) => {
                    const attendance = attendanceByUserId.get(
                      enrollment.userId,
                    );

                    return (
                      <tr
                        key={enrollment.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-4 pr-4 align-top">
                          <p className="font-medium text-slate-950">
                            {enrollment.user.profile?.fullName ?? "-"}
                          </p>
                          <p className="mt-1 text-xs text-slate-600">
                            {enrollment.user.email}
                          </p>
                        </td>

                        <td className="py-4 pr-4 align-top text-xs text-slate-700">
                          <p>NIM: {enrollment.user.profile?.nim ?? "-"}</p>
                          <p className="mt-1">
                            Prodi:{" "}
                            {enrollment.user.profile?.programStudy ?? "-"}
                          </p>
                          <p className="mt-1">
                            Semester: {enrollment.user.profile?.semester ?? "-"}
                          </p>
                        </td>

                        <td className="py-4 pr-4 align-top">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {attendance?.status ?? "NOT_RECORDED"}
                          </span>
                        </td>

                        <td className="py-4 pr-4 align-top text-slate-700">
                          {attendance?.method ?? "-"}
                        </td>

                        <td className="py-4 pr-4 align-top text-xs text-slate-700">
                          {attendance
                            ? formatDateTime(attendance.checkedInAt)
                            : "-"}
                        </td>

                        <td className="py-4 pr-4 align-top text-xs text-slate-700">
                          {attendance?.correctedAt ? (
                            <>
                              <p>
                                Corrected at:{" "}
                                {formatDateTime(attendance.correctedAt)}
                              </p>
                              <p className="mt-1">
                                By: {attendance.correctedBy?.email ?? "-"}
                              </p>
                              <p className="mt-1">
                                Note: {attendance.note ?? "-"}
                              </p>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="py-4 pr-4 align-top">
                          <ManualCorrectionModal
                            sessionId={selectedSession.id}
                            userId={enrollment.userId}
                            participantName={
                              enrollment.user.profile?.fullName ??
                              enrollment.user.email
                            }
                            currentStatus={attendance?.status}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {approvedEnrollments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-sm text-slate-500"
                      >
                        Belum ada participant approved di cohort ini.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
            Belum ada sesi.
          </div>
        )}
      </section>
    </main>
  );
}
