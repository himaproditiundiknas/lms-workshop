"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { submissionFormSchema } from "@/lib/submission/schema";

export type SubmissionFormState = {
  message?: string;
  ok?: boolean;
  errors?: {
    assignmentId?: string[];
    repositoryUrl?: string[];
    deploymentUrl?: string[];
    contentText?: string[];
  };
};

export async function submitAssignmentAction(
  _prevState: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      message: "Session login tidak valid. Silakan login ulang.",
    };
  }

  const parsed = submissionFormSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
    repositoryUrl: formData.get("repositoryUrl"),
    deploymentUrl: formData.get("deploymentUrl"),
    contentText: formData.get("contentText"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data submission.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const email = user.email.toLowerCase();
  const now = new Date();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const appUser = await tx.user.findUnique({
        where: {
          email,
        },
        include: {
          profile: true,
        },
      });

      if (!appUser) {
        return {
          ok: false,
          message: "Data user tidak ditemukan. Silakan login ulang.",
        };
      }

      if (!appUser.profile?.profileCompletedAt) {
        return {
          ok: false,
          message: "Lengkapi profil terlebih dahulu sebelum submit tugas.",
        };
      }

      const assignment = await tx.assignment.findUnique({
        where: {
          id: data.assignmentId,
        },
        include: {
          workshop: true,
        },
      });

      if (!assignment) {
        return {
          ok: false,
          message: "Assignment tidak ditemukan.",
        };
      }

      if (assignment.status !== "PUBLISHED") {
        return {
          ok: false,
          message: "Assignment ini tidak sedang dibuka untuk submission.",
        };
      }

      const approvedEnrollment = await tx.enrollment.findFirst({
        where: {
          userId: appUser.id,
          status: "APPROVED",
          cohort: {
            workshopId: assignment.workshopId,
          },
        },
      });

      if (!approvedEnrollment) {
        return {
          ok: false,
          message: "Kamu belum approved untuk workshop assignment ini.",
        };
      }

      const isPastDue = Boolean(assignment.dueAt && now > assignment.dueAt);

      if (isPastDue && !assignment.allowLate) {
        return {
          ok: false,
          message:
            "Submission sudah melewati due date dan late submission tidak diperbolehkan.",
        };
      }

      const latestSubmission = await tx.submission.findFirst({
        where: {
          assignmentId: assignment.id,
          userId: appUser.id,
          isLatest: true,
        },
        orderBy: {
          attemptNo: "desc",
        },
      });

      const lastSubmission = await tx.submission.findFirst({
        where: {
          assignmentId: assignment.id,
          userId: appUser.id,
        },
        orderBy: {
          attemptNo: "desc",
        },
      });

      const nextAttemptNo = (lastSubmission?.attemptNo ?? 0) + 1;

      if (latestSubmission) {
        await tx.submission.update({
          where: {
            id: latestSubmission.id,
          },
          data: {
            isLatest: false,
          },
        });
      }

      const submission = await tx.submission.create({
        data: {
          assignmentId: assignment.id,
          userId: appUser.id,
          attemptNo: nextAttemptNo,
          isLatest: true,
          status: isPastDue ? "LATE" : "SUBMITTED",
          repositoryUrl: data.repositoryUrl ?? null,
          deploymentUrl: data.deploymentUrl ?? null,
          contentText: data.contentText || null,
          submittedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: appUser.id,
          action: "submission.created",
          entityType: "submission",
          entityId: submission.id,
          metadata: {
            assignmentId: assignment.id,
            assignmentTitle: assignment.title,
            workshopId: assignment.workshopId,
            workshopTitle: assignment.workshop.title,
            attemptNo: submission.attemptNo,
            isLatest: submission.isLatest,
            status: submission.status,
            repositoryUrl: submission.repositoryUrl,
            deploymentUrl: submission.deploymentUrl,
          },
        },
      });

      return {
        ok: true,
        message:
          nextAttemptNo === 1
            ? "Submission berhasil dikirim."
            : `Resubmission berhasil dikirim sebagai attempt #${nextAttemptNo}.`,
      };
    });

    revalidatePath("/assignments");
    revalidatePath(`/assignments/${data.assignmentId}/submit`);

    return {
      ok: result.ok,
      message: result.message,
    };
  } catch (error) {
    console.error("Failed to submit assignment:", error);

    return {
      message: "Gagal mengirim submission. Coba lagi.",
    };
  }
}
