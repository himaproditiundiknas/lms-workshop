"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { gradeSubmissionSchema } from "@/lib/submission/grading-schema";

export type GradeSubmissionState = {
  message?: string;
  ok?: boolean;
  errors?: {
    submissionId?: string[];
    score?: string[];
    feedback?: string[];
  };
};

export async function gradeSubmissionAction(
  _prevState: GradeSubmissionState,
  formData: FormData,
): Promise<GradeSubmissionState> {
  const actor = await requireMentorOrAdmin();

  const parsed = gradeSubmissionSchema.safeParse({
    submissionId: formData.get("submissionId"),
    score: formData.get("score"),
    feedback: formData.get("feedback"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data grading.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { submissionId, score, feedback } = parsed.data;
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

    if (submission.status === "REOPENED") {
      return {
        ok: false,
        message: "Submission yang sedang reopened belum bisa dinilai.",
      };
    }

    const gradedSubmission = await tx.submission.update({
      where: {
        id: submission.id,
      },
      data: {
        score,
        feedback: feedback || null,
        gradedAt: now,
        gradedById: actor.id,
        status: "GRADED",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "submission.graded",
        entityType: "submission",
        entityId: gradedSubmission.id,
        metadata: {
          assignmentId: submission.assignmentId,
          assignmentTitle: submission.assignment.title,
          workshopId: submission.assignment.workshopId,
          workshopTitle: submission.assignment.workshop.title,
          participantUserId: submission.userId,
          participantEmail: submission.user.email,
          participantName: submission.user.profile?.fullName ?? null,
          attemptNo: submission.attemptNo,
          previousStatus: submission.status,
          nextStatus: "GRADED",
          score,
          feedback: feedback || null,
        },
      },
    });

    return {
      ok: true,
      message: "Submission berhasil dinilai.",
    };
  });

  revalidatePath("/mentor/submissions");
  revalidatePath(`/mentor/submissions/${submissionId}`);
  revalidatePath("/assignments");

  return {
    ok: result.ok,
    message: result.message,
  };
}
