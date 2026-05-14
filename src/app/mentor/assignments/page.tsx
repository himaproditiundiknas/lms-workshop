import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { AssignmentForm } from "./assignment-form";
import { closeAssignmentAction, publishAssignmentAction } from "./actions";

type MentorAssignmentsPageProps = {
  searchParams: Promise<{
    workshop?: string;
    category?: string;
    status?: string;
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

export default async function MentorAssignmentsPage({
  searchParams,
}: MentorAssignmentsPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const workshopFilter = params.workshop?.trim();
  const categoryFilter = params.category?.trim();
  const statusFilter = params.status?.trim();

  const [workshops, sessions, assignments] = await Promise.all([
    prisma.workshop.findMany({
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
    prisma.session.findMany({
      orderBy: [
        {
          cohort: {
            workshop: {
              title: "asc",
            },
          },
        },
        {
          meetingNo: "asc",
        },
      ],
      include: {
        cohort: {
          include: {
            workshop: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    }),
    prisma.assignment.findMany({
      where: {
        ...(workshopFilter
          ? {
              workshopId: workshopFilter,
            }
          : {}),
        ...(categoryFilter
          ? {
              category: categoryFilter as "REGULAR" | "FINAL_PROJECT",
            }
          : {}),
        ...(statusFilter
          ? {
              status: statusFilter as
                | "DRAFT"
                | "PUBLISHED"
                | "CLOSED"
                | "ARCHIVED",
            }
          : {}),
      },
      orderBy: [
        {
          workshop: {
            title: "asc",
          },
        },
        {
          createdAt: "desc",
        },
      ],
      include: {
        workshop: true,
        session: {
          include: {
            cohort: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[420px_1fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">
            Buat Assignment
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Buat tugas regular atau final project untuk workshop.
          </p>

          <div className="mt-6">
            <AssignmentForm workshops={workshops} sessions={sessions} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Assignment Management
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  Daftar Assignment
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Publish assignment agar terlihat oleh peserta approved, atau
                  close jika submission sudah ditutup.
                </p>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/assignments"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  View Participant
                </Link>
                <LogoutButton />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
              <select
                name="workshop"
                defaultValue={workshopFilter ?? ""}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
              >
                <option value="">Semua workshop</option>
                {workshops.map((workshop) => (
                  <option key={workshop.id} value={workshop.id}>
                    {workshop.title}
                  </option>
                ))}
              </select>

              <select
                name="category"
                defaultValue={categoryFilter ?? ""}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
              >
                <option value="">Semua category</option>
                <option value="REGULAR">Regular</option>
                <option value="FINAL_PROJECT">Final Project</option>
              </select>

              <select
                name="status"
                defaultValue={statusFilter ?? ""}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
              >
                <option value="">Semua status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CLOSED">Closed</option>
                <option value="ARCHIVED">Archived</option>
              </select>

              <button
                type="submit"
                className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Filter
              </button>

              <Link
                href="/mentor/assignments"
                className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Reset
              </Link>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3 pr-4 font-medium">Assignment</th>
                    <th className="py-3 pr-4 font-medium">Workshop/Session</th>
                    <th className="py-3 pr-4 font-medium">Category</th>
                    <th className="py-3 pr-4 font-medium">Due</th>
                    <th className="py-3 pr-4 font-medium">Score</th>
                    <th className="py-3 pr-4 font-medium">Rules</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Submissions</th>
                    <th className="py-3 pr-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id} className="border-b last:border-0">
                      <td className="py-4 pr-4 align-top">
                        <p className="font-medium text-slate-950">
                          {assignment.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          /{assignment.slug}
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs text-slate-600">
                          {assignment.description ?? "-"}
                        </p>
                      </td>

                      <td className="py-4 pr-4 align-top text-xs text-slate-700">
                        <p className="font-medium text-slate-950">
                          {assignment.workshop.title}
                        </p>
                        {assignment.session ? (
                          <p className="mt-1">
                            {assignment.session.cohort.name} · Meeting #
                            {assignment.session.meetingNo}
                          </p>
                        ) : (
                          <p className="mt-1 text-slate-500">
                            Tidak terkait session
                          </p>
                        )}
                      </td>

                      <td className="py-4 pr-4 align-top">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {assignment.category}
                        </span>
                      </td>

                      <td className="py-4 pr-4 align-top text-xs text-slate-700">
                        {formatDateTime(assignment.dueAt)}
                      </td>

                      <td className="py-4 pr-4 align-top text-slate-700">
                        {assignment.maxScore}
                      </td>

                      <td className="py-4 pr-4 align-top text-xs text-slate-700">
                        <p>Late: {assignment.allowLate ? "Yes" : "No"}</p>
                        <p className="mt-1">
                          Certificate:{" "}
                          {assignment.requiredForCertificate ? "Required" : "-"}
                        </p>
                      </td>

                      <td className="py-4 pr-4 align-top">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {assignment.status}
                        </span>
                      </td>

                      <td className="py-4 pr-4 align-top text-slate-700">
                        {assignment._count.submissions}
                      </td>

                      <td className="space-y-2 py-4 pr-4 align-top">
                        {assignment.status !== "PUBLISHED" ? (
                          <form action={publishAssignmentAction}>
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.id}
                            />
                            <button
                              type="submit"
                              className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                            >
                              Publish
                            </button>
                          </form>
                        ) : (
                          <form action={closeAssignmentAction}>
                            <input
                              type="hidden"
                              name="assignmentId"
                              value={assignment.id}
                            />
                            <button
                              type="submit"
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                            >
                              Close
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}

                  {assignments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-10 text-center text-sm text-slate-500"
                      >
                        Belum ada assignment.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
