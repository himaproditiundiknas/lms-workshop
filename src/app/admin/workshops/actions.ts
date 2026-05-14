"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/workshop/slug";
import { workshopFormSchema } from "@/lib/workshop/schema";

export type WorkshopFormState = {
  message?: string;
  errors?: {
    title?: string[];
    slug?: string[];
    description?: string[];
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

export async function createWorkshopAction(
  _prevState: WorkshopFormState,
  formData: FormData,
): Promise<WorkshopFormState> {
  const actor = await requireAdmin();

  const parsed = workshopFormSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data workshop.",
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

  try {
    const workshop = await prisma.workshop.create({
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        status: data.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "workshop.created",
        entityType: "workshop",
        entityId: workshop.id,
        metadata: {
          title: workshop.title,
          slug: workshop.slug,
          status: workshop.status,
        },
      },
    });

    revalidatePath("/admin/workshops");

    return {
      message: "Workshop berhasil dibuat.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Slug workshop sudah digunakan.",
        errors: {
          slug: ["Slug workshop sudah digunakan."],
        },
      };
    }

    console.error("Failed to create workshop:", error);

    return {
      message: "Gagal membuat workshop.",
    };
  }
}

export async function updateWorkshopAction(
  workshopId: string,
  _prevState: WorkshopFormState,
  formData: FormData,
): Promise<WorkshopFormState> {
  const actor = await requireAdmin();

  const parsed = workshopFormSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data workshop.",
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

  try {
    const workshop = await prisma.workshop.update({
      where: {
        id: workshopId,
      },
      data: {
        title: data.title,
        slug,
        description: data.description || null,
        status: data.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "workshop.updated",
        entityType: "workshop",
        entityId: workshop.id,
        metadata: {
          title: workshop.title,
          slug: workshop.slug,
          status: workshop.status,
        },
      },
    });

    revalidatePath("/admin/workshops");
    revalidatePath(`/admin/workshops/${workshopId}/edit`);

    return {
      message: "Workshop berhasil diperbarui.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Slug workshop sudah digunakan.",
        errors: {
          slug: ["Slug workshop sudah digunakan."],
        },
      };
    }

    console.error("Failed to update workshop:", error);

    return {
      message: "Gagal memperbarui workshop.",
    };
  }
}
