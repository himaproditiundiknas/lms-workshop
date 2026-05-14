"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { sessionFormSchema } from "@/lib/session/schema";

export type SessionFormState = {
  message?: string;
  errors?: {
    cohortId?: string[];
    meetingNo?: string[];
    title?: string[];
    description?: string[];
    location?: string[];
    startsAt?: string[];
    endsAt?: string[];
  };
};

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function createSessionAction(
  _prevState: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const actor = await requireAdmin();

  const parsed = sessionFormSchema.safeParse({
    cohortId: formData.get("cohortId"),
    meetingNo: formData.get("meetingNo"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data sesi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const cohort = await prisma.cohort.findUnique({
    where: {
      id: data.cohortId,
    },
    include: {
      workshop: true,
    },
  });

  if (!cohort) {
    return {
      message: "Cohort tidak ditemukan.",
      errors: {
        cohortId: ["Cohort tidak ditemukan."],
      },
    };
  }

  try {
    const session = await prisma.session.create({
      data: {
        cohortId: data.cohortId,
        meetingNo: data.meetingNo,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        attendanceStatus: "NOT_OPENED",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "session.created",
        entityType: "session",
        entityId: session.id,
        metadata: {
          cohortId: session.cohortId,
          workshopId: cohort.workshopId,
          meetingNo: session.meetingNo,
          title: session.title,
        },
      },
    });

    revalidatePath("/admin/sessions");
    revalidatePath("/mentor/sessions");

    return {
      message: "Sesi berhasil dibuat.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Meeting number sudah digunakan di cohort ini.",
        errors: {
          meetingNo: ["Meeting number sudah digunakan di cohort ini."],
        },
      };
    }

    console.error("Failed to create session:", error);

    return {
      message: "Gagal membuat sesi.",
    };
  }
}

export async function updateSessionAction(
  sessionId: string,
  _prevState: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const actor = await requireAdmin();

  const parsed = sessionFormSchema.safeParse({
    cohortId: formData.get("cohortId"),
    meetingNo: formData.get("meetingNo"),
    title: formData.get("title"),
    description: formData.get("description"),
    location: formData.get("location"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data sesi.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const cohort = await prisma.cohort.findUnique({
    where: {
      id: data.cohortId,
    },
    include: {
      workshop: true,
    },
  });

  if (!cohort) {
    return {
      message: "Cohort tidak ditemukan.",
      errors: {
        cohortId: ["Cohort tidak ditemukan."],
      },
    };
  }

  try {
    const session = await prisma.session.update({
      where: {
        id: sessionId,
      },
      data: {
        cohortId: data.cohortId,
        meetingNo: data.meetingNo,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "session.updated",
        entityType: "session",
        entityId: session.id,
        metadata: {
          cohortId: session.cohortId,
          workshopId: cohort.workshopId,
          meetingNo: session.meetingNo,
          title: session.title,
        },
      },
    });

    revalidatePath("/admin/sessions");
    revalidatePath(`/admin/sessions/${sessionId}/edit`);
    revalidatePath("/mentor/sessions");

    return {
      message: "Sesi berhasil diperbarui.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Meeting number sudah digunakan di cohort ini.",
        errors: {
          meetingNo: ["Meeting number sudah digunakan di cohort ini."],
        },
      };
    }

    console.error("Failed to update session:", error);

    return {
      message: "Gagal memperbarui sesi.",
    };
  }
}
