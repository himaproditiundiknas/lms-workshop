import Link from "next/link";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { ReopenSubmissionModal } from "./reopen-submission-modal";

type MentorSubmissionsPageProps = {
  searchParams: Promise<{
    assignment?: string;
    status?: string;
    latest?: string;
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

export default async function MentorSubmissionsPage({
  searchParams,
}: MentorSubmissionsPageProps) {
  await requireMentorOrAdmin();

  const params = await searchParams;
  const assignmentFilter = params.assignment?.trim();
  const statusFilter = params.status?.trim();
  const latestFilter = params.latest?.trim();

  const [assignments, submissions] = await Promise.all([
    prisma.assignment.findMany({
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
    }),
    prisma.submission.findMany({
      where: {
        ...(assignmentFilter
          ? {
              assignmentId: assignmentFilter,
            }
          : {}),
        ...(statusFilter
          ? {
              status: statusFilter as
                | "SUBMITTED"
                | "LATE"
                | "REOPENED"
                | "GRADED"
                | "RETURNED",
            }
          : {}),
        ...(latestFilter === "latest"
          ? {
              isLatest: true,
            }
          : {}),
      },
      orderBy: [
        {
          submittedAt: "desc",
        },
        {
          attemptNo: "desc",
        },
      ],
      include: {
        assignment: {
          include: {
            workshop: true,
          },
        },
        user: {
          include: {
            profile: true,
          },
        },
        reopenedBy: {
          select: {
            email: true,
          },
        },
        gradedBy: {
          select: {
            email: true,
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
                Submission Management
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Reopen Submission
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Buka ulang submission peserta tanpa menghapus history attempt.
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/mentor"
                className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Dashboard
              </Link>
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

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <form className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto_auto]">
            <select
              name="assignment"
              defaultValue={assignmentFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua assignment</option>
              {assignments.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.workshop.title} — {assignment.title}
                </option>
              ))}
            </select>

            <select
              name="status"
              defaultValue={statusFilter ?? ""}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="LATE">Late</option>
              <option value="REOPENED">Reopened</option>
              <option value="GRADED">Graded</option>
              <option value="RETURNED">Returned</option>
            </select>

            <select
              name="latest"
              defaultValue={latestFilter ?? "latest"}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950"
            >
              <option value="">Semua attempt</option>
              <option value="latest">Latest only</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Filter
            </button>

            <Link
              href="/mentor/submissions?latest=latest"
              className="rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Reset
            </Link>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-3 pr-4 font-medium">Participant</th>
                  <th className="py-3 pr-4 font-medium">Assignment</th>
                  <th className="py-3 pr-4 font-medium">Attempt</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Submitted</th>
                  <th className="py-3 pr-4 font-medium">Links</th>
                  <th className="py-3 pr-4 font-medium">Reopen Info</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="border-b last:border-0">
                    <td className="py-4 pr-4 align-top">
                      <p className="font-medium text-slate-950">
                        {submission.user.profile?.fullName ?? "-"}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {submission.user.email}
                      </p>
                    </td>

                    <td className="py-4 pr-4 align-top">
                      <p className="font-medium text-slate-950">
                        {submission.assignment.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        {submission.assignment.workshop.title}
                      </p>
                    </td>

                    <td className="py-4 pr-4 align-top text-slate-700">
                      <p>#{submission.attemptNo}</p>
                      <p className="mt-1 text-xs">
                        {submission.isLatest ? "Latest" : "History"}
                      </p>
                    </td>

                    <td className="py-4 pr-4 align-top">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {submission.status}
                      </span>
                    </td>

                    <td className="py-4 pr-4 align-top text-xs text-slate-700">
                      {formatDateTime(submission.submittedAt)}
                    </td>

                    <td className="py-4 pr-4 align-top text-xs">
                      {submission.repositoryUrl ? (
                        <a
                          href={submission.repositoryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block font-medium text-blue-700 hover:underline"
                        >
                          Repository
                        </a>
                      ) : null}

                      {submission.deploymentUrl ? (
                        <a
                          href={submission.deploymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block font-medium text-blue-700 hover:underline"
                        >
                          Deployment
                        </a>
                      ) : null}

                      {!submission.repositoryUrl && !submission.deploymentUrl
                        ? "-"
                        : null}
                    </td>

                    <td className="py-4 pr-4 align-top text-xs text-slate-700">
                      {submission.reopenedAt ? (
                        <>
                          <p>
                            Reopened at: {formatDateTime(submission.reopenedAt)}
                          </p>
                          <p className="mt-1">
                            By: {submission.reopenedBy?.email ?? "-"}
                          </p>
                          <p className="mt-1">
                            Reason: {submission.reopenReason ?? "-"}
                          </p>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="space-y-2 py-4 pr-4 align-top">
                      <Link
                        href={`/mentor/submissions/${submission.id}`}
                        className="inline-flex rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
                      >
                        Review
                      </Link>

                      <div>
                        <ReopenSubmissionModal
                          submissionId={submission.id}
                          participantName={
                            submission.user.profile?.fullName ??
                            submission.user.email
                          }
                          assignmentTitle={submission.assignment.title}
                          disabled={
                            !submission.isLatest ||
                            submission.status === "REOPENED"
                          }
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {submissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      Belum ada submission.
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
