import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";
import { SubmissionForm } from "./submission-form";

type SubmitAssignmentPageProps = {
  params: Promise<{
    assignmentId: string;
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

export default async function SubmitAssignmentPage({
  params,
}: SubmitAssignmentPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const { assignmentId } = await params;

  const appUser = await prisma.user.findUnique({
    where: {
      email: user.email.toLowerCase(),
    },
  });

  if (!appUser) {
    redirect("/login");
  }

  const assignment = await prisma.assignment.findUnique({
    where: {
      id: assignmentId,
    },
    include: {
      workshop: true,
      session: {
        include: {
          cohort: true,
        },
      },
    },
  });

  if (!assignment) {
    notFound();
  }

  const approvedEnrollment = await prisma.enrollment.findFirst({
    where: {
      userId: appUser.id,
      status: "APPROVED",
      cohort: {
        workshopId: assignment.workshopId,
      },
    },
  });

  if (!approvedEnrollment) {
    redirect("/assignments");
  }

  const latestSubmission = await prisma.submission.findFirst({
    where: {
      assignmentId: assignment.id,
      userId: appUser.id,
      isLatest: true,
    },
    orderBy: {
      attemptNo: "desc",
    },
    select: {
      attemptNo: true,
      repositoryUrl: true,
      deploymentUrl: true,
      contentText: true,
      status: true,
      submittedAt: true,
      score: true,
      feedback: true,
      gradedAt: true,
    },
  });

  const isSubmittable = assignment.status === "PUBLISHED";
  const isPastDue = Boolean(assignment.dueAt && new Date() > assignment.dueAt);
  const isBlockedByDueDate = isPastDue && !assignment.allowLate;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/assignments"
            className="text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            ← Kembali ke assignments
          </Link>

          <LogoutButton />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            {assignment.workshop.title}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">
            {assignment.title}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {assignment.category}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {assignment.status}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              Max Score: {assignment.maxScore}
            </span>
            {assignment.requiredForCertificate ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                Required for Certificate
              </span>
            ) : null}
          </div>

          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              <span className="font-medium text-slate-950">Due:</span>{" "}
              {formatDateTime(assignment.dueAt)}
            </p>
            <p className="mt-1">
              <span className="font-medium text-slate-950">Late:</span>{" "}
              {assignment.allowLate ? "Allowed" : "Not allowed"}
            </p>
            {assignment.session ? (
              <p className="mt-1">
                <span className="font-medium text-slate-950">Session:</span>{" "}
                {assignment.session.cohort.name} · Meeting #
                {assignment.session.meetingNo}
              </p>
            ) : null}
          </div>

          {assignment.description ? (
            <div className="mt-5 whitespace-pre-wrap rounded-lg bg-white text-sm text-slate-700">
              {assignment.description}
            </div>
          ) : null}
        </div>

        {latestSubmission ? (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">
              Submission Terakhir
            </h2>
            <div className="mt-3 text-sm text-slate-700">
              <p>Attempt #{latestSubmission.attemptNo}</p>
              <p className="mt-1">Status: {latestSubmission.status}</p>
              <p className="mt-1">
                Submitted: {formatDateTime(latestSubmission.submittedAt)}
              </p>
            </div>
          </div>
        ) : null}

        {latestSubmission && latestSubmission.status === "GRADED" ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-medium">
              Nilai: {latestSubmission.score ?? "-"} / 100
            </p>
            <p className="mt-1">
              Graded at: {formatDateTime(latestSubmission.gradedAt)}
            </p>
            {latestSubmission.feedback ? (
              <p className="mt-3 whitespace-pre-wrap">
                Feedback: {latestSubmission.feedback}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">
            {latestSubmission ? "Resubmit Assignment" : "Submit Assignment"}
          </h2>

          {!isSubmittable ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Assignment ini tidak sedang dibuka untuk submission.
            </div>
          ) : isBlockedByDueDate ? (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Submission sudah melewati due date dan late submission tidak
              diperbolehkan.
            </div>
          ) : (
            <div className="mt-5">
              <SubmissionForm
                assignmentId={assignment.id}
                latestSubmission={latestSubmission}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
