import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

type MentorFinalProjectsPageProps = {
  searchParams: Promise<{
    assignment?: string;
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

function getUniqueTruthyValues(values: Array<string | null | undefined>) {
  return new Set(values.filter((value): value is string => Boolean(value)));
}

export default async function MentorFinalProjectsPage({
  searchParams,
}: MentorFinalProjectsPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const assignmentFilter = params.assignment?.trim();

  const finalProjectAssignments = await prisma.assignment.findMany({
    where: {
      category: "FINAL_PROJECT",
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
    },
  });

  const selectedAssignment =
    finalProjectAssignments.find(
      (assignment) => assignment.id === assignmentFilter,
    ) ?? finalProjectAssignments[0];

  const projectGroups = selectedAssignment
    ? await prisma.projectGroup.findMany({
        where: {
          cohort: {
            workshopId: selectedAssignment.workshopId,
          },
          status: {
            not: "ARCHIVED",
          },
        },
        orderBy: [
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
                  submissions: {
                    where: {
                      assignmentId: selectedAssignment.id,
                      isLatest: true,
                    },
                    orderBy: {
                      attemptNo: "desc",
                    },
                    take: 1,
                    include: {
                      files: true,
                    },
                  },
                },
              },
            },
          },
        },
      })
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Final Project Progress
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Progress Submission Final Project
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Pantau submission final project per anggota group dan cek
                konsistensi link antar anggota.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/mentor/project-groups"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Project Groups
              </Link>
              <Link
                href="/mentor/submissions?latest=latest"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Submissions
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <select
              name="assignment"
              defaultValue={selectedAssignment?.id ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              {finalProjectAssignments.length === 0 ? (
                <option value="">Belum ada final project assignment</option>
              ) : null}
              {finalProjectAssignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.workshop.title} — {assignment.title}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Pilih Assignment
            </button>
          </form>

          {selectedAssignment ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-slate-950">
                {selectedAssignment.title}
              </p>
              <p className="mt-1">{selectedAssignment.workshop.title}</p>
              <p className="mt-1">
                Due: {formatDateTime(selectedAssignment.dueAt)}
              </p>
              <p className="mt-1">
                Status: {selectedAssignment.status} · Max Score:{" "}
                {selectedAssignment.maxScore}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-5">
          {projectGroups.map((group) => {
            const latestSubmissions = group.members
              .map((member) => member.user.submissions[0])
              .filter(Boolean);

            const repositoryUrls = getUniqueTruthyValues(
              latestSubmissions.map((submission) => submission.repositoryUrl),
            );

            const deploymentUrls = getUniqueTruthyValues(
              latestSubmissions.map((submission) => submission.deploymentUrl),
            );

            const pdfUrls = getUniqueTruthyValues(
              latestSubmissions.map(
                (submission) => submission.files[0]?.fileUrl,
              ),
            );

            const hasDifferentRepositoryUrls = repositoryUrls.size > 1;
            const hasDifferentDeploymentUrls = deploymentUrls.size > 1;
            const hasDifferentPdfUrls = pdfUrls.size > 1;

            const submittedCount = latestSubmissions.length;
            const memberCount = group.members.length;

            return (
              <article
                key={group.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-semibold text-slate-950">
                        {group.name}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {group.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {group.cohort.workshop.title} — {group.cohort.name}
                    </p>
                    {group.title ? (
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        Project: {group.title}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-slate-600">
                      Mentor:{" "}
                      {group.mentor
                        ? (group.mentor.profile?.fullName ?? group.mentor.email)
                        : "-"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p className="font-medium text-slate-950">
                      Progress: {submittedCount}/{memberCount} member submit
                    </p>
                    <p className="mt-1">
                      Missing: {Math.max(0, memberCount - submittedCount)}
                    </p>
                  </div>
                </div>

                {hasDifferentRepositoryUrls ||
                hasDifferentDeploymentUrls ||
                hasDifferentPdfUrls ? (
                  <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    <p className="font-medium">
                      Link antar member berbeda. Cek ulang konsistensi final
                      project group.
                    </p>
                    {hasDifferentRepositoryUrls ? (
                      <p className="mt-1">Repository URL berbeda.</p>
                    ) : null}
                    {hasDifferentDeploymentUrls ? (
                      <p className="mt-1">Deployment URL berbeda.</p>
                    ) : null}
                    {hasDifferentPdfUrls ? (
                      <p className="mt-1">PDF URL berbeda.</p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="py-3 pr-4 font-medium">Member</th>
                        <th className="py-3 pr-4 font-medium">Role</th>
                        <th className="py-3 pr-4 font-medium">Status</th>
                        <th className="py-3 pr-4 font-medium">Attempt</th>
                        <th className="py-3 pr-4 font-medium">Repository</th>
                        <th className="py-3 pr-4 font-medium">Deployment</th>
                        <th className="py-3 pr-4 font-medium">PDF</th>
                        <th className="py-3 pr-4 font-medium">Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.members.map((member) => {
                        const submission = member.user.submissions[0];
                        const pdfFile = submission?.files[0];

                        return (
                          <tr
                            key={member.id}
                            className="border-b last:border-0"
                          >
                            <td className="py-4 pr-4 align-top">
                              <p className="font-medium text-slate-950">
                                {member.user.profile?.fullName ?? "-"}
                              </p>
                              <p className="mt-1 text-xs text-slate-600">
                                {member.user.email}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                NIM: {member.user.profile?.nim ?? "-"}
                              </p>
                            </td>

                            <td className="py-4 pr-4 align-top">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                {member.role}
                              </span>
                            </td>

                            <td className="py-4 pr-4 align-top">
                              {submission ? (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                                  {submission.status}
                                </span>
                              ) : (
                                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                                  NOT_SUBMITTED
                                </span>
                              )}
                            </td>

                            <td className="py-4 pr-4 align-top text-slate-700">
                              {submission ? `#${submission.attemptNo}` : "-"}
                            </td>

                            <td className="py-4 pr-4 align-top text-xs">
                              {submission?.repositoryUrl ? (
                                <a
                                  href={submission.repositoryUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  Repository
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="py-4 pr-4 align-top text-xs">
                              {submission?.deploymentUrl ? (
                                <a
                                  href={submission.deploymentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  Deployment
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="py-4 pr-4 align-top text-xs">
                              {pdfFile ? (
                                <a
                                  href={pdfFile.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  PDF
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>

                            <td className="py-4 pr-4 align-top text-xs text-slate-700">
                              {submission
                                ? formatDateTime(submission.submittedAt)
                                : "-"}
                            </td>
                          </tr>
                        );
                      })}

                      {group.members.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-8 text-center text-sm text-slate-500"
                          >
                            Belum ada member di group ini.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </article>
            );
          })}

          {selectedAssignment && projectGroups.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Belum ada project group untuk workshop assignment ini.
            </div>
          ) : null}

          {!selectedAssignment ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Belum ada final project assignment.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
