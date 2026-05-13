"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { slugify } from "@/lib/workshop/slug";
import {
  materialFormSchema,
  materialStatusSchema,
  moduleFormSchema,
} from "@/lib/material/schema";

export type ModuleFormState = {
  message?: string;
  errors?: {
    workshopId?: string[];
    title?: string[];
    slug?: string[];
    description?: string[];
    orderNo?: string[];
    status?: string[];
  };
};

export type MaterialFormState = {
  message?: string;
  errors?: {
    moduleId?: string[];
    sessionId?: string[];
    title?: string[];
    description?: string[];
    type?: string[];
    orderNo?: string[];
    content?: string[];
    url?: string[];
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

export async function createModuleAction(
  _prevState: ModuleFormState,
  formData: FormData,
): Promise<ModuleFormState> {
  const actor = await requireMentorOrAdmin();

  const parsed = moduleFormSchema.safeParse({
    workshopId: formData.get("workshopId"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    orderNo: formData.get("orderNo"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data module.",
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

  try {
    const createdModule = await prisma.module.create({
      data: {
        workshopId: data.workshopId,
        title: data.title,
        slug,
        description: data.description || null,
        orderNo: data.orderNo,
        status: data.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "module.created",
        entityType: "module",
        entityId: createdModule.id,
        metadata: {
          workshopId: createdModule.workshopId,
          title: createdModule.title,
          slug: createdModule.slug,
          orderNo: createdModule.orderNo,
          status: createdModule.status,
        },
      },
    });

    revalidatePath("/mentor/materials");
    revalidatePath("/materials");

    return {
      message: "Module berhasil dibuat.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Slug atau urutan module sudah digunakan di workshop ini.",
        errors: {
          slug: ["Slug atau urutan module sudah digunakan di workshop ini."],
          orderNo: ["Slug atau urutan module sudah digunakan di workshop ini."],
        },
      };
    }

    console.error("Failed to create module:", error);

    return {
      message: "Gagal membuat module.",
    };
  }
}

export async function createMaterialAction(
  _prevState: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  const actor = await requireMentorOrAdmin();

  const parsed = materialFormSchema.safeParse({
    moduleId: formData.get("moduleId"),
    sessionId: formData.get("sessionId"),
    title: formData.get("title"),
    description: formData.get("description"),
    type: formData.get("type"),
    orderNo: formData.get("orderNo"),
    content: formData.get("content"),
    url: formData.get("url"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data material.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  const moduleRecord = await prisma.module.findUnique({
    where: {
      id: data.moduleId,
    },
    include: {
      workshop: true,
    },
  });

  if (!moduleRecord) {
    return {
      message: "Module tidak ditemukan.",
      errors: {
        moduleId: ["Module tidak ditemukan."],
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

    if (session.cohort.workshopId !== moduleRecord.workshopId) {
      return {
        message: "Session tidak berada di workshop yang sama dengan module.",
        errors: {
          sessionId: ["Session tidak berada di workshop yang sama."],
        },
      };
    }
  }

  try {
    const material = await prisma.material.create({
      data: {
        moduleId: data.moduleId,
        sessionId: data.sessionId ?? null,
        title: data.title,
        description: data.description || null,
        type: data.type,
        status: data.status,
        orderNo: data.orderNo,
        content: data.type === "TEXT" ? data.content || null : null,
        url: data.type === "LINK" ? data.url || null : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "material.created",
        entityType: "material",
        entityId: material.id,
        metadata: {
          moduleId: material.moduleId,
          sessionId: material.sessionId,
          title: material.title,
          type: material.type,
          status: material.status,
          orderNo: material.orderNo,
        },
      },
    });

    revalidatePath("/mentor/materials");
    revalidatePath("/materials");

    return {
      message: "Material berhasil dibuat.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Urutan material sudah digunakan di module ini.",
        errors: {
          orderNo: ["Urutan material sudah digunakan di module ini."],
        },
      };
    }

    console.error("Failed to create material:", error);

    return {
      message: "Gagal membuat material.",
    };
  }
}

export async function publishMaterialAction(formData: FormData) {
  const actor = await requireMentorOrAdmin();

  const parsed = materialStatusSchema.safeParse({
    materialId: formData.get("materialId"),
  });

  if (!parsed.success) {
    return;
  }

  const material = await prisma.material.update({
    where: {
      id: parsed.data.materialId,
    },
    data: {
      status: "PUBLISHED",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "material.published",
      entityType: "material",
      entityId: material.id,
      metadata: {
        moduleId: material.moduleId,
        title: material.title,
      },
    },
  });

  revalidatePath("/mentor/materials");
  revalidatePath("/materials");
}

export async function unpublishMaterialAction(formData: FormData) {
  const actor = await requireMentorOrAdmin();

  const parsed = materialStatusSchema.safeParse({
    materialId: formData.get("materialId"),
  });

  if (!parsed.success) {
    return;
  }

  const material = await prisma.material.update({
    where: {
      id: parsed.data.materialId,
    },
    data: {
      status: "DRAFT",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "material.unpublished",
      entityType: "material",
      entityId: material.id,
      metadata: {
        moduleId: material.moduleId,
        title: material.title,
      },
    },
  });

  revalidatePath("/mentor/materials");
  revalidatePath("/materials");
}
