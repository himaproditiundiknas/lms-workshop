"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  approveEnrollmentSchema,
  rejectEnrollmentSchema,
} from "@/lib/enrollment/schema";

export type EnrollmentActionState = {
  message?: string;
  errors?: {
    enrollmentId?: string[];
    cohortId?: string[];
    rejectionReason?: string[];
  };
};

export async function approveEnrollmentAction(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const actor = await requireAdmin();

  const parsed = approveEnrollmentSchema.safeParse({
    enrollmentId: formData.get("enrollmentId"),
    cohortId: formData.get("cohortId"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data approval.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { enrollmentId, cohortId } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: {
        id: enrollmentId,
      },
      include: {
        invitationCode: true,
        user: true,
      },
    });

    if (!enrollment) {
      return {
        ok: false,
        message: "Enrollment tidak ditemukan.",
      };
    }

    if (enrollment.status !== "PENDING") {
      return {
        ok: false,
        message: "Enrollment sudah diproses.",
      };
    }

    const finalCohortId =
      enrollment.scope === "COHORT" ? enrollment.targetId : cohortId;

    if (!finalCohortId) {
      return {
        ok: false,
        message: "Cohort ID wajib diisi untuk invitation scope workshop.",
        errors: {
          cohortId: ["Cohort ID wajib diisi untuk scope workshop."],
        },
      };
    }

    const participantRole = await tx.role.findUnique({
      where: {
        name: "participant",
      },
    });

    if (participantRole) {
      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: enrollment.userId,
            roleId: participantRole.id,
          },
        },
        update: {},
        create: {
          userId: enrollment.userId,
          roleId: participantRole.id,
        },
      });
    }

    const approvedEnrollment = await tx.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        status: "APPROVED",
        cohortId: finalCohortId,
        approvedAt: new Date(),
        approvedById: actor.id,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "enrollment.approved",
        entityType: "enrollment",
        entityId: approvedEnrollment.id,
        metadata: {
          userId: enrollment.userId,
          userEmail: enrollment.user.email,
          scope: enrollment.scope,
          targetId: enrollment.targetId,
          cohortId: finalCohortId,
          invitationCodeId: enrollment.invitationCodeId,
        },
      },
    });

    return {
      ok: true,
      message: "Enrollment berhasil di-approve.",
    };
  });

  revalidatePath("/admin/enrollments");

  if (!result.ok) {
    return {
      message: result.message,
      errors: "errors" in result ? result.errors : undefined,
    };
  }

  return {
    message: result.message,
  };
}

export async function rejectEnrollmentAction(
  _prevState: EnrollmentActionState,
  formData: FormData,
): Promise<EnrollmentActionState> {
  const actor = await requireAdmin();

  const parsed = rejectEnrollmentSchema.safeParse({
    enrollmentId: formData.get("enrollmentId"),
    rejectionReason: formData.get("rejectionReason"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data rejection.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { enrollmentId, rejectionReason } = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: {
        id: enrollmentId,
      },
      include: {
        user: true,
      },
    });

    if (!enrollment) {
      return {
        ok: false,
        message: "Enrollment tidak ditemukan.",
      };
    }

    if (enrollment.status !== "PENDING") {
      return {
        ok: false,
        message: "Enrollment sudah diproses.",
      };
    }

    const rejectedEnrollment = await tx.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedById: actor.id,
        rejectionReason: rejectionReason || null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "enrollment.rejected",
        entityType: "enrollment",
        entityId: rejectedEnrollment.id,
        metadata: {
          userId: enrollment.userId,
          userEmail: enrollment.user.email,
          scope: enrollment.scope,
          targetId: enrollment.targetId,
          reason: rejectionReason || null,
        },
      },
    });

    return {
      ok: true,
      message: "Enrollment berhasil di-reject.",
    };
  });

  revalidatePath("/admin/enrollments");

  return {
    message: result.message,
  };
}
