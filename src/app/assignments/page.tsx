import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { LogoutButton } from "@/components/logout-button";

function formatDateTime(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function ParticipantAssignmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: user.email.toLowerCase(),
    },
    include: {
      enrollments: {
        where: {
          status: "APPROVED",
        },
        include: {
          cohort: true,
        },
      },
    },
  });

  if (!appUser) {
    redirect("/login");
  }

  const workshopIds = Array.from(
    new Set(
      appUser.enrollments
        .map((enrollment) => enrollment.cohort?.workshopId)
        .filter((workshopId): workshopId is string => Boolean(workshopId)),
    ),
  );

  if (workshopIds.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">
            Belum Ada Assignment
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Kamu belum approved di cohort mana pun, jadi belum ada assignment
            yang bisa diakses.
          </p>
          <div className="mt-6">
            <LogoutButton />
          </div>
        </section>
      </main>
    );
  }

  const assignments = await prisma.assignment.findMany({
    where: {
      workshopId: {
        in: workshopIds,
      },
      status: "PUBLISHED",
    },
    orderBy: [
      {
        dueAt: "asc",
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
      submissions: {
        where: {
          userId: appUser.id,
          isLatest: true,
        },
        orderBy: {
          attemptNo: "desc",
        },
        take: 1,
        include: {
          projectGroup: true,
          files: true,
        },
      },
    },
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Assignments</p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-950">
                Tugas Workshop
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Tugas published dari workshop yang sudah kamu ikuti.
              </p>
            </div>

            <LogoutButton />
          </div>
        </div>

        <div className="space-y-4">
          {assignments.map((assignment) => {
            const latestSubmission = assignment.submissions[0];

            return (
              <article
                key={assignment.id}
                className="rounded-2xl bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {assignment.workshop.title}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">
                      {assignment.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {assignment.category}
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
                  </div>

                  <div className="text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-950">Due:</span>{" "}
                      {formatDateTime(assignment.dueAt)}
                    </p>
                    <p className="mt-1">
                      <span className="font-medium text-slate-950">Late:</span>{" "}
                      {assignment.allowLate ? "Allowed" : "Not allowed"}
                    </p>
                  </div>
                </div>

                {assignment.session ? (
                  <p className="mt-4 text-sm text-slate-600">
                    Session: {assignment.session.cohort.name} · Meeting #
                    {assignment.session.meetingNo}
                  </p>
                ) : null}

                {assignment.description ? (
                  <div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
                    {assignment.description}
                  </div>
                ) : null}

                <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  {latestSubmission ? (
                    <div className="text-sm text-slate-700">
                      <p className="font-medium text-slate-950">
                        Submission terakhir
                      </p>
                      <p className="mt-1">
                        Attempt #{latestSubmission.attemptNo} ·{" "}
                        {latestSubmission.status}
                      </p>
                      <p className="mt-1">
                        Submitted at{" "}
                        {formatDateTime(latestSubmission.submittedAt)}
                      </p>

                      {latestSubmission.projectGroup ? (
                        <p className="mt-1">
                          Group: {latestSubmission.projectGroup.name}
                        </p>
                      ) : null}

                      {latestSubmission.files.length > 0 ? (
                        <div className="mt-3">
                          <p className="font-medium text-slate-950">
                            File / PDF
                          </p>
                          <ul className="mt-1 space-y-1">
                            {latestSubmission.files.map((file) => (
                              <li key={file.id}>
                                <a
                                  href={file.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  {file.fileName}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {latestSubmission.status === "GRADED" ? (
                        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                          <p className="font-medium">
                            Nilai: {latestSubmission.score ?? "-"} / 100
                          </p>
                          {latestSubmission.feedback ? (
                            <p className="mt-2 whitespace-pre-wrap">
                              Feedback: {latestSubmission.feedback}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">
                      Kamu belum submit assignment ini.
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <Link
                    href={`/assignments/${assignment.id}/submit`}
                    className="inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    {latestSubmission
                      ? "Lihat / Resubmit"
                      : "Submit Assignment"}
                  </Link>
                </div>
              </article>
            );
          })}

          {assignments.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Belum ada assignment published.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
