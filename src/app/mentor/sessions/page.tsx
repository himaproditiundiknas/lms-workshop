import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { SessionAttendanceActions } from "@/components/attendance/session-attendance-actions";

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function MentorSessionsPage() {
  await requireMentorOrAdmin();

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

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-6xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950">
              Daftar Sesi
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Daftar sesi yang dapat dilihat mentor untuk persiapan presensi.
            </p>
          </div>

          <LogoutButton />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b text-slate-500">
                <th className="py-3 pr-4 font-medium">Meeting</th>
                <th className="py-3 pr-4 font-medium">Session</th>
                <th className="py-3 pr-4 font-medium">Workshop/Cohort</th>
                <th className="py-3 pr-4 font-medium">Schedule</th>
                <th className="py-3 pr-4 font-medium">Location</th>
                <th className="py-3 pr-4 font-medium">Attendance</th>
                <th className="py-3 pr-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-semibold text-slate-950">
                    #{session.meetingNo}
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-950">
                      {session.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                      {session.description ?? "-"}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    <p>{session.cohort.workshop.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.cohort.name}
                    </p>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-700">
                    <p>{formatDateTime(session.startsAt)}</p>
                    <p className="mt-1">{formatDateTime(session.endsAt)}</p>
                  </td>
                  <td className="py-3 pr-4 text-slate-700">
                    {session.location ?? "-"}
                  </td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      {session.attendanceStatus}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <SessionAttendanceActions
                      sessionId={session.id}
                      attendanceStatus={session.attendanceStatus}
                    />
                  </td>
                </tr>
              ))}

              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-8 text-center text-sm text-slate-500"
                  >
                    Belum ada sesi.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
