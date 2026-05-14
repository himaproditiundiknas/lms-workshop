import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import {
  activateProjectGroupAction,
  archiveProjectGroupAction,
  lockProjectGroupAction,
  removeProjectGroupMemberAction,
} from "./actions";
import { ProjectGroupForm } from "./project-group-form";
import { ProjectGroupMemberForm } from "./project-group-member-form";

type MentorProjectGroupsPageProps = {
  searchParams: Promise<{
    cohort?: string;
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

export default async function MentorProjectGroupsPage({
  searchParams,
}: MentorProjectGroupsPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const cohortFilter = params.cohort?.trim();
  const statusFilter = params.status?.trim();

  const [cohorts, users, approvedEnrollments, projectGroups] =
    await Promise.all([
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
      prisma.user.findMany({
        orderBy: {
          email: "asc",
        },
        include: {
          profile: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      prisma.enrollment.findMany({
        where: {
          status: "APPROVED",
          ...(cohortFilter
            ? {
                cohortId: cohortFilter,
              }
            : {}),
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          user: {
            include: {
              profile: {
                select: {
                  fullName: true,
                  nim: true,
                },
              },
            },
          },
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
      prisma.projectGroup.findMany({
        where: {
          ...(cohortFilter
            ? {
                cohortId: cohortFilter,
              }
            : {}),
          ...(statusFilter
            ? {
                status: statusFilter as "ACTIVE" | "LOCKED" | "ARCHIVED",
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
            name: "asc",
          },
        ],
        include: {
          cohort: {
            include: {
              workshop: true,
            },
          },
          mentor: {
            include: {
              profile: true,
            },
          },
          members: {
            orderBy: [
              {
                role: "asc",
              },
              {
                joinedAt: "asc",
              },
            ],
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
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
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Project Groups
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Kelola Project Group
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Buat group final project, assign mentor, dan masukkan peserta
                approved ke group.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/mentor/assignments"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Assignments
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Buat Project Group
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Satu group terikat ke satu cohort.
            </p>

            <div className="mt-6">
              <ProjectGroupForm cohorts={cohorts} users={users} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Tambah Member
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Peserta hanya bisa masuk satu project group per cohort.
            </p>

            <div className="mt-6">
              <ProjectGroupMemberForm
                projectGroups={projectGroups}
                approvedEnrollments={approvedEnrollments}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                Project Group List
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Filter group berdasarkan cohort dan status.
              </p>
            </div>
          </div>

          <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto_auto]">
            <select
              name="cohort"
              defaultValue={cohortFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua cohort</option>
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.workshop.title} — {cohort.name}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua status</option>
              <option value="ACTIVE">Active</option>
              <option value="LOCKED">Locked</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>

            <Link
              href="/mentor/project-groups"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          <div className="space-y-5">
            {projectGroups.map((projectGroup) => (
              <article
                key={projectGroup.id}
                className="rounded-2xl border border-slate-200 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {projectGroup.name}
                      </h3>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {projectGroup.status}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-600">
                      {projectGroup.cohort.workshop.title} —{" "}
                      {projectGroup.cohort.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      /{projectGroup.slug} · Created{" "}
                      {formatDateTime(projectGroup.createdAt)}
                    </p>

                    {projectGroup.title ? (
                      <p className="mt-3 font-medium text-slate-950">
                        Project: {projectGroup.title}
                      </p>
                    ) : null}

                    {projectGroup.description ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {projectGroup.description}
                      </p>
                    ) : null}

                    <div className="mt-3 text-xs text-slate-600">
                      <p>
                        Mentor:{" "}
                        {projectGroup.mentor
                          ? (projectGroup.mentor.profile?.fullName ??
                            projectGroup.mentor.email)
                          : "-"}
                      </p>
                      <p className="mt-1">
                        Submissions: {projectGroup._count.submissions}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      {projectGroup.repositoryUrl ? (
                        <a
                          href={projectGroup.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-700 hover:underline"
                        >
                          Repository
                        </a>
                      ) : null}

                      {projectGroup.deploymentUrl ? (
                        <a
                          href={projectGroup.deploymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-medium text-blue-700 hover:underline"
                        >
                          Deployment
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {projectGroup.status !== "LOCKED" ? (
                      <form action={lockProjectGroupAction}>
                        <input
                          type="hidden"
                          name="projectGroupId"
                          value={projectGroup.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-50"
                        >
                          Lock
                        </button>
                      </form>
                    ) : (
                      <form action={activateProjectGroupAction}>
                        <input
                          type="hidden"
                          name="projectGroupId"
                          value={projectGroup.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Activate
                        </button>
                      </form>
                    )}

                    {projectGroup.status !== "ARCHIVED" ? (
                      <form action={archiveProjectGroupAction}>
                        <input
                          type="hidden"
                          name="projectGroupId"
                          value={projectGroup.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                        >
                          Archive
                        </button>
                      </form>
                    ) : (
                      <form action={activateProjectGroupAction}>
                        <input
                          type="hidden"
                          name="projectGroupId"
                          value={projectGroup.id}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Restore
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="py-3 pr-4 font-medium">Member</th>
                        <th className="py-3 pr-4 font-medium">NIM</th>
                        <th className="py-3 pr-4 font-medium">Role</th>
                        <th className="py-3 pr-4 font-medium">Joined</th>
                        <th className="py-3 pr-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectGroup.members.map((member) => (
                        <tr key={member.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 align-top">
                            <p className="font-medium text-slate-950">
                              {member.user.profile?.fullName ?? "-"}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {member.user.email}
                            </p>
                          </td>
                          <td className="py-3 pr-4 align-top text-slate-700">
                            {member.user.profile?.nim ?? "-"}
                          </td>
                          <td className="py-3 pr-4 align-top">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {member.role}
                            </span>
                          </td>
                          <td className="py-3 pr-4 align-top text-xs text-slate-700">
                            {formatDateTime(member.joinedAt)}
                          </td>
                          <td className="py-3 pr-4 align-top">
                            {projectGroup.status === "ACTIVE" ? (
                              <form action={removeProjectGroupMemberAction}>
                                <input
                                  type="hidden"
                                  name="memberId"
                                  value={member.id}
                                />
                                <button
                                  type="submit"
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </form>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Locked
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {projectGroup.members.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-6 text-center text-sm text-slate-500"
                          >
                            Belum ada member.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}

            {projectGroups.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                Belum ada project group.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
