import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { GradeSubmissionForm } from "./grade-submission-form";

type SubmissionDetailPageProps = {
  params: Promise<{
    submissionId: string;
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

export default async function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  await requireMentorOrAdmin();

  const { submissionId } = await params;

  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId,
    },
    include: {
      assignment: {
        include: {
          workshop: true,
          session: {
            include: {
              cohort: true,
            },
          },
        },
      },
      user: {
        include: {
          profile: true,
        },
      },
      files: true,
      gradedBy: {
        select: {
          email: true,
        },
      },
      reopenedBy: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!submission) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/mentor/submissions?latest=latest"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Kembali ke submissions
          </Link>

          <LogoutButton />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Submission Review
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {submission.assignment.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {submission.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              Attempt #{submission.attemptNo}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {submission.isLatest ? "Latest" : "History"}
            </span>
          </div>

          <div className="mt-5 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <p className="font-medium text-slate-950">Participant</p>
              <p className="mt-1">{submission.user.profile?.fullName ?? "-"}</p>
              <p className="mt-1 text-xs">{submission.user.email}</p>
            </div>

            <div>
              <p className="font-medium text-slate-950">Workshop</p>
              <p className="mt-1">{submission.assignment.workshop.title}</p>
              {submission.assignment.session ? (
                <p className="mt-1 text-xs">
                  {submission.assignment.session.cohort.name} · Meeting #
                  {submission.assignment.session.meetingNo}
                </p>
              ) : null}
            </div>

            <div>
              <p className="font-medium text-slate-950">Submitted</p>
              <p className="mt-1">{formatDateTime(submission.submittedAt)}</p>
            </div>

            <div>
              <p className="font-medium text-slate-950">Grading</p>
              <p className="mt-1">Score: {submission.score ?? "-"} / 100</p>
              <p className="mt-1 text-xs">
                Graded at: {formatDateTime(submission.gradedAt)}
              </p>
              <p className="mt-1 text-xs">
                By: {submission.gradedBy?.email ?? "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Submission Content
              </h2>

              <div className="mt-5 space-y-4 text-sm text-slate-700">
                <div>
                  <p className="font-medium text-slate-950">Repository URL</p>
                  {submission.repositoryUrl ? (
                    <a
                      href={submission.repositoryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex font-medium text-blue-700 hover:underline"
                    >
                      {submission.repositoryUrl}
                    </a>
                  ) : (
                    <p className="mt-1">-</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-slate-950">Deployment URL</p>
                  {submission.deploymentUrl ? (
                    <a
                      href={submission.deploymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex font-medium text-blue-700 hover:underline"
                    >
                      {submission.deploymentUrl}
                    </a>
                  ) : (
                    <p className="mt-1">-</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-slate-950">Catatan</p>
                  {submission.contentText ? (
                    <div className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-4">
                      {submission.contentText}
                    </div>
                  ) : (
                    <p className="mt-1">-</p>
                  )}
                </div>

                <div>
                  <p className="font-medium text-slate-950">Files</p>
                  {submission.files.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {submission.files.map((file) => (
                        <li key={file.id}>
                          <a
                            href={file.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-700 hover:underline"
                          >
                            {file.fileName}
                          </a>
                          <span className="ml-2 text-xs text-slate-500">
                            {file.mimeType} · {file.fileSize} bytes
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1">-</p>
                  )}
                </div>
              </div>
            </div>

            {submission.reopenedAt ? (
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Reopen Info
                </h2>
                <div className="mt-3 text-sm text-slate-700">
                  <p>Reopened at: {formatDateTime(submission.reopenedAt)}</p>
                  <p className="mt-1">
                    By: {submission.reopenedBy?.email ?? "-"}
                  </p>
                  <p className="mt-1">
                    Reason: {submission.reopenReason ?? "-"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Grade & Feedback
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Beri nilai 0–100 dan feedback untuk peserta.
            </p>

            {submission.status === "REOPENED" ? (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Submission ini sedang reopened. Tunggu peserta mengirim attempt
                baru sebelum dinilai.
              </div>
            ) : (
              <div className="mt-5">
                <GradeSubmissionForm
                  submissionId={submission.id}
                  currentScore={submission.score}
                  currentFeedback={submission.feedback}
                />
              </div>
            )}

            {submission.feedback ? (
              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-medium text-slate-950">Feedback tersimpan</p>
                <p className="mt-2 whitespace-pre-wrap">
                  {submission.feedback}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
