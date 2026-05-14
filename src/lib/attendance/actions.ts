"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";

export type AttendanceSessionActionState = {
  message?: string;
};

export async function openAttendanceAction(
  _prevState: AttendanceSessionActionState,
  formData: FormData,
): Promise<AttendanceSessionActionState> {
  const actor = await requireMentorOrAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!sessionId) {
    return {
      message: "Session ID tidak valid.",
    };
  }

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

    if (session.attendanceStatus === "OPEN") {
      return {
        ok: false,
        message: "Presensi sudah dibuka.",
      };
    }

    if (session.attendanceStatus === "CLOSED") {
      return {
        ok: false,
        message: "Presensi sudah ditutup dan tidak bisa dibuka ulang.",
      };
    }

    const openedSession = await tx.session.update({
      where: {
        id: session.id,
      },
      data: {
        attendanceStatus: "OPEN",
        attendanceOpenedAt: new Date(),
        attendanceOpenedBy: actor.id,
        attendanceClosedAt: null,
        attendanceClosedBy: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "attendance.opened",
        entityType: "session",
        entityId: openedSession.id,
        metadata: {
          sessionId: openedSession.id,
          meetingNo: openedSession.meetingNo,
          title: openedSession.title,
          cohortId: session.cohortId,
          cohortName: session.cohort.name,
          workshopId: session.cohort.workshopId,
          workshopTitle: session.cohort.workshop.title,
        },
      },
    });

    return {
      ok: true,
      message: "Presensi berhasil dibuka.",
    };
  });

  revalidatePath("/mentor/sessions");
  revalidatePath("/admin/sessions");

  return {
    message: result.message,
  };
}

export async function closeAttendanceAction(
  _prevState: AttendanceSessionActionState,
  formData: FormData,
): Promise<AttendanceSessionActionState> {
  const actor = await requireMentorOrAdmin();
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!sessionId) {
    return {
      message: "Session ID tidak valid.",
    };
  }

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

    if (session.attendanceStatus === "NOT_OPENED") {
      return {
        ok: false,
        message: "Presensi belum dibuka.",
      };
    }

    if (session.attendanceStatus === "CLOSED") {
      return {
        ok: false,
        message: "Presensi sudah ditutup.",
      };
    }

    const closedSession = await tx.session.update({
      where: {
        id: session.id,
      },
      data: {
        attendanceStatus: "CLOSED",
        attendanceClosedAt: new Date(),
        attendanceClosedBy: actor.id,
      },
    });

    await tx.qrToken.deleteMany({
      where: {
        sessionId: session.id,
      },
    });

    const approvedEnrollments = await tx.enrollment.findMany({
      where: {
        cohortId: session.cohortId,
        status: "APPROVED",
      },
      select: {
        userId: true,
      },
    });

    for (const enrollment of approvedEnrollments) {
      await tx.attendance.upsert({
        where: {
          sessionId_userId: {
            sessionId: session.id,
            userId: enrollment.userId,
          },
        },
        update: {},
        create: {
          sessionId: session.id,
          userId: enrollment.userId,
          status: "ABSENT",
          method: "SYSTEM",
          recordedById: actor.id,
          note: "Auto-marked absent when attendance was closed.",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "attendance.closed",
        entityType: "session",
        entityId: closedSession.id,
        metadata: {
          sessionId: closedSession.id,
          meetingNo: closedSession.meetingNo,
          title: closedSession.title,
          cohortId: session.cohortId,
          cohortName: session.cohort.name,
          workshopId: session.cohort.workshopId,
          workshopTitle: session.cohort.workshop.title,
          autoMarkedAbsentCount: approvedEnrollments.length,
        },
      },
    });

    return {
      ok: true,
      message: "Presensi berhasil ditutup.",
    };
  });

  revalidatePath("/mentor/sessions");
  revalidatePath("/admin/sessions");

  return {
    message: result.message,
  };
}
