"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { reopenSubmissionSchema } from "@/lib/submission/reopen-schema";
import { createAuditLog, toAuditMetadata } from "@/lib/audit/audit-log";

export type ReopenSubmissionState = {
  message?: string;
  errors?: {
    submissionId?: string[];
    reason?: string[];
  };
};

export async function reopenSubmissionAction(
  _prevState: ReopenSubmissionState,
  formData: FormData,
): Promise<ReopenSubmissionState> {
  const actor = await requireMentorOrAdmin();

  const parsed = reopenSubmissionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data reopen submission.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { submissionId, reason } = parsed.data;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const submission = await tx.submission.findUnique({
      where: {
        id: submissionId,
      },
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
      },
    });

    if (!submission) {
      return {
        ok: false,
        message: "Submission tidak ditemukan.",
      };
    }

    if (!submission.isLatest) {
      return {
        ok: false,
        message: "Hanya latest submission yang bisa dibuka ulang.",
      };
    }

    if (submission.status === "REOPENED") {
      return {
        ok: false,
        message: "Submission ini sudah dalam status reopened.",
      };
    }

    const reopenedSubmission = await tx.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        status: "REOPENED",
        reopenedAt: now,
        reopenedById: actor.id,
        reopenReason: reason,
      },
    });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "submission.reopened",
        entityType: "submission",
        entityId: reopenedSubmission.id,
        metadata: toAuditMetadata({
          assignmentId: submission.assignmentId,
          assignmentTitle: submission.assignment.title,
          workshopId: submission.assignment.workshopId,
          workshopTitle: submission.assignment.workshop.title,
          participantUserId: submission.userId,
          participantEmail: submission.user.email,
          participantName: submission.user.profile?.fullName ?? null,
          attemptNo: submission.attemptNo,
          previousStatus: submission.status,
          nextStatus: "REOPENED",
          reason,
        }),
      },
      tx,
    );

    return {
      ok: true,
      message: "Submission berhasil dibuka ulang.",
    };
  });

  revalidatePath("/mentor/submissions");
  revalidatePath("/assignments");

  return {
    message: result.message,
  };
}
