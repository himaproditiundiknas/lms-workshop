import Link from "next/link";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { SessionForm } from "./session-form";

type AdminSessionsPageProps = {
  searchParams: Promise<{
    workshop?: string;
    cohort?: string;
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

export default async function AdminSessionsPage({
  searchParams,
}: AdminSessionsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const workshopFilter = params.workshop?.trim();
  const cohortFilter = params.cohort?.trim();

  const [cohorts, sessions] = await Promise.all([
    prisma.cohort.findMany({
      orderBy: [
        {
          workshop: {
            title: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      include: {
        workshop: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.session.findMany({
      where: {
        ...(cohortFilter
          ? {
              cohortId: cohortFilter,
            }
          : {}),
        ...(workshopFilter
          ? {
              cohort: {
                workshopId: workshopFilter,
              },
            }
          : {}),
      },
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
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Buat Sesi</h1>
          <p className="mt-1 text-sm text-slate-600">
            Tambahkan sesi/pertemuan untuk cohort.
          </p>

          <div className="mt-6">
            <SessionForm mode="create" cohorts={cohorts} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">
                Session List
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Kelola daftar sesi berdasarkan workshop dan cohort.
              </p>
            </div>

            <LogoutButton />
          </div>

          <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <input
              name="workshop"
              type="text"
              defaultValue={workshopFilter}
              placeholder="Filter workshop UUID"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            />
            <input
              name="cohort"
              type="text"
              defaultValue={cohortFilter}
              placeholder="Filter cohort UUID"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>
            <Link
              href="/admin/sessions"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
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
                      <Link
                        href={`/admin/sessions/${session.id}/edit`}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                      >
                        Edit
                      </Link>
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
        </div>
      </section>
    </main>
  );
}
