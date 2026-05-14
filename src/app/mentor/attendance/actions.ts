"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { manualAttendanceCorrectionSchema } from "@/lib/attendance/schema";

export type ManualAttendanceCorrectionState = {
  message?: string;
  errors?: {
    sessionId?: string[];
    userId?: string[];
    status?: string[];
    note?: string[];
  };
};

export async function correctAttendanceAction(
  _prevState: ManualAttendanceCorrectionState,
  formData: FormData,
): Promise<ManualAttendanceCorrectionState> {
  const actor = await requireMentorOrAdmin();

  const parsed = manualAttendanceCorrectionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    userId: formData.get("userId"),
    status: formData.get("status"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data koreksi presensi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { sessionId, userId, status, note } = parsed.data;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const session = await tx.session.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        cohort: {
          include: {
            workshop: true,
          },
        },
      },
    });

    if (!session) {
      return {
        ok: false,
        message: "Sesi tidak ditemukan.",
      };
    }

    const enrollment = await tx.enrollment.findFirst({
      where: {
        userId,
        cohortId: session.cohortId,
        status: "APPROVED",
      },
      include: {
        user: true,
      },
    });

    if (!enrollment) {
      return {
        ok: false,
        message: "User tidak approved di cohort sesi ini.",
      };
    }

    const existingAttendance = await tx.attendance.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
    });

    const attendance = await tx.attendance.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        status,
        method: "MANUAL",
        recordedById: actor.id,
        correctedById: actor.id,
        correctedAt: now,
        note,
      },
      create: {
        sessionId,
        userId,
        status,
        method: "MANUAL",
        checkedInAt: now,
        recordedById: actor.id,
        correctedById: actor.id,
        correctedAt: now,
        note,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "attendance.corrected",
        entityType: "attendance",
        entityId: attendance.id,
        metadata: {
          sessionId,
          sessionTitle: session.title,
          meetingNo: session.meetingNo,
          cohortId: session.cohortId,
          cohortName: session.cohort.name,
          workshopId: session.cohort.workshopId,
          workshopTitle: session.cohort.workshop.title,
          userId,
          userEmail: enrollment.user.email,
          previousStatus: existingAttendance?.status ?? null,
          previousMethod: existingAttendance?.method ?? null,
          nextStatus: status,
          nextMethod: "MANUAL",
          note,
        },
      },
    });

    return {
      ok: true,
      message: "Presensi berhasil dikoreksi.",
    };
  });

  revalidatePath("/mentor/attendance");

  return {
    message: result.message,
  };
}
