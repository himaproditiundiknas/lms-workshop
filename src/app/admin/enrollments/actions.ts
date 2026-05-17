"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { createAuditLog, toAuditMetadata } from "@/lib/audit/audit-log";

export type EnrollmentActionState = {
  message?: string;
  errors?: {
    cohortId?: string[];
  };
};

function redirectWithMessage(type: "success" | "error", message: string): never {
  const params = new URLSearchParams();
  params.set(type, message);

  redirect(`/admin/enrollments?${params.toString()}`);
}

export async function approveEnrollmentAction(formData: FormData) {
  const actor = await requireMentorOrAdmin();

  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  const selectedCohortId = String(formData.get("cohortId") ?? "").trim();

  if (!enrollmentId) {
    redirectWithMessage("error", "Enrollment tidak valid.");
  }

  await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: {
        id: enrollmentId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error("Enrollment tidak ditemukan.");
    }

    if (enrollment.status !== "PENDING") {
      throw new Error("Enrollment ini sudah diproses.");
    }

    let cohortId = selectedCohortId;

    if (enrollment.scope === "COHORT") {
      cohortId = enrollment.targetId;
    }

    if (!cohortId) {
      throw new Error("Pilih cohort terlebih dahulu.");
    }

    const cohort = await tx.cohort.findUnique({
      where: {
        id: cohortId,
      },
      include: {
        workshop: true,
      },
    });

    if (!cohort) {
      throw new Error("Cohort tidak ditemukan.");
    }

    if (
      enrollment.scope === "WORKSHOP" &&
      cohort.workshopId !== enrollment.targetId
    ) {
      throw new Error("Cohort tidak sesuai dengan workshop enrollment.");
    }

    if (enrollment.scope === "COHORT" && cohort.id !== enrollment.targetId) {
      throw new Error("Cohort tidak sesuai dengan target enrollment.");
    }

    const approvedEnrollment = await tx.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        status: "APPROVED",
        cohortId: cohort.id,
        approvedAt: new Date(),
        approvedById: actor.id,
        rejectedAt: null,
        rejectedById: null,
        rejectionReason: null,
      },
    });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "enrollment.approved",
        entityType: "enrollment",
        entityId: approvedEnrollment.id,
        metadata: toAuditMetadata({
          enrollmentId: approvedEnrollment.id,
          participantUserId: enrollment.userId,
          participantEmail: enrollment.user.email,
          participantName: enrollment.user.profile?.fullName ?? null,
          scope: enrollment.scope,
          targetId: enrollment.targetId,
          cohortId: cohort.id,
          cohortName: cohort.name,
          workshopId: cohort.workshopId,
          workshopTitle: cohort.workshop.title,
        }),
      },
      tx,
    );
  });

  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");
  revalidatePath("/dashboard");

  redirectWithMessage("success", "Enrollment berhasil di-approve.");
}

export async function rejectEnrollmentAction(formData: FormData) {
  const actor = await requireMentorOrAdmin();

  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();

  if (!enrollmentId) {
    redirectWithMessage("error", "Enrollment tidak valid.");
  }

  await prisma.$transaction(async (tx) => {
    const enrollment = await tx.enrollment.findUnique({
      where: {
        id: enrollmentId,
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new Error("Enrollment tidak ditemukan.");
    }

    if (enrollment.status !== "PENDING") {
      throw new Error("Enrollment ini sudah diproses.");
    }

    const rejectedEnrollment = await tx.enrollment.update({
      where: {
        id: enrollment.id,
      },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        rejectedById: actor.id,
        rejectionReason: reason || null,
      },
    });

    await createAuditLog(
      {
        actorUserId: actor.id,
        action: "enrollment.rejected",
        entityType: "enrollment",
        entityId: rejectedEnrollment.id,
        metadata: toAuditMetadata({
          enrollmentId: rejectedEnrollment.id,
          participantUserId: enrollment.userId,
          participantEmail: enrollment.user.email,
          participantName: enrollment.user.profile?.fullName ?? null,
          scope: enrollment.scope,
          targetId: enrollment.targetId,
          reason: reason || null,
        }),
      },
      tx,
    );
  });

  revalidatePath("/admin/enrollments");
  revalidatePath("/admin");

  redirectWithMessage("success", "Enrollment berhasil di-reject.");
}
