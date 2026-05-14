"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { slugify } from "@/lib/workshop/slug";
import {
  assignmentFormSchema,
  assignmentStatusSchema,
} from "@/lib/assignment/schema";

export type AssignmentFormState = {
  message?: string;
  errors?: {
    workshopId?: string[];
    sessionId?: string[];
    title?: string[];
    slug?: string[];
    description?: string[];
    category?: string[];
    dueAt?: string[];
    maxScore?: string[];
    allowLate?: string[];
    requiredForCertificate?: string[];
    status?: string[];
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

export async function createAssignmentAction(
  _prevState: AssignmentFormState,
  formData: FormData,
): Promise<AssignmentFormState> {
  const actor = await requireMentorOrAdmin();

  const parsed = assignmentFormSchema.safeParse({
    workshopId: formData.get("workshopId"),
    sessionId: formData.get("sessionId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    category: formData.get("category"),
    dueAt: formData.get("dueAt"),
    maxScore: formData.get("maxScore"),
    allowLate: formData.get("allowLate"),
    requiredForCertificate: formData.get("requiredForCertificate"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data assignment.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  if (!slug) {
    return {
      message: "Slug tidak valid.",
      errors: {
        slug: ["Slug tidak valid."],
      },
    };
  }

  const workshop = await prisma.workshop.findUnique({
    where: {
      id: data.workshopId,
    },
  });

  if (!workshop) {
    return {
      message: "Workshop tidak ditemukan.",
      errors: {
        workshopId: ["Workshop tidak ditemukan."],
      },
    };
  }

  if (data.sessionId) {
    const session = await prisma.session.findUnique({
      where: {
        id: data.sessionId,
      },
      include: {
        cohort: true,
      },
    });

    if (!session) {
      return {
        message: "Session tidak ditemukan.",
        errors: {
          sessionId: ["Session tidak ditemukan."],
        },
      };
    }

    if (session.cohort.workshopId !== data.workshopId) {
      return {
        message: "Session tidak berada di workshop yang sama.",
        errors: {
          sessionId: ["Session tidak berada di workshop yang sama."],
        },
      };
    }
  }

  try {
    const assignment = await prisma.assignment.create({
      data: {
        workshopId: data.workshopId,
        sessionId: data.sessionId ?? null,
        createdById: actor.id,
        title: data.title,
        slug,
        description: data.description || null,
        category: data.category,
        status: data.status,
        dueAt: data.dueAt,
        maxScore: data.maxScore,
        allowLate: data.allowLate,
        requiredForCertificate: data.requiredForCertificate,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "assignment.created",
        entityType: "assignment",
        entityId: assignment.id,
        metadata: {
          workshopId: assignment.workshopId,
          sessionId: assignment.sessionId,
          title: assignment.title,
          slug: assignment.slug,
          category: assignment.category,
          status: assignment.status,
          dueAt: assignment.dueAt?.toISOString() ?? null,
          maxScore: assignment.maxScore,
          allowLate: assignment.allowLate,
          requiredForCertificate: assignment.requiredForCertificate,
        },
      },
    });

    revalidatePath("/mentor/assignments");
    revalidatePath("/assignments");

    return {
      message: "Assignment berhasil dibuat.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Slug assignment sudah digunakan di workshop ini.",
        errors: {
          slug: ["Slug assignment sudah digunakan di workshop ini."],
        },
      };
    }

    console.error("Failed to create assignment:", error);

    return {
      message: "Gagal membuat assignment.",
    };
  }
}

export async function publishAssignmentAction(formData: FormData) {
  const actor = await requireMentorOrAdmin();

  const parsed = assignmentStatusSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
  });

  if (!parsed.success) {
    return;
  }

  const assignment = await prisma.assignment.update({
    where: {
      id: parsed.data.assignmentId,
    },
    data: {
      status: "PUBLISHED",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "assignment.published",
      entityType: "assignment",
      entityId: assignment.id,
      metadata: {
        workshopId: assignment.workshopId,
        title: assignment.title,
        category: assignment.category,
      },
    },
  });

  revalidatePath("/mentor/assignments");
  revalidatePath("/assignments");
}

export async function closeAssignmentAction(formData: FormData) {
  const actor = await requireMentorOrAdmin();

  const parsed = assignmentStatusSchema.safeParse({
    assignmentId: formData.get("assignmentId"),
  });

  if (!parsed.success) {
    return;
  }

  const assignment = await prisma.assignment.update({
    where: {
      id: parsed.data.assignmentId,
    },
    data: {
      status: "CLOSED",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "assignment.closed",
      entityType: "assignment",
      entityId: assignment.id,
      metadata: {
        workshopId: assignment.workshopId,
        title: assignment.title,
        category: assignment.category,
      },
    },
  });

  revalidatePath("/mentor/assignments");
  revalidatePath("/assignments");
}
