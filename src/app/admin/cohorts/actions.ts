"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/require-admin";
import { slugify } from "@/lib/workshop/slug";
import { cohortFormSchema } from "@/lib/workshop/schema";

export type CohortFormState = {
  message?: string;
  errors?: {
    workshopId?: string[];
    name?: string[];
    slug?: string[];
    status?: string[];
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

export async function createCohortAction(
  _prevState: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  const actor = await requireAdmin();

  const parsed = cohortFormSchema.safeParse({
    workshopId: formData.get("workshopId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    status: formData.get("status"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data cohort.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

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
    const cohort = await prisma.cohort.create({
      data: {
        workshopId: data.workshopId,
        name: data.name,
        slug,
        status: data.status,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "cohort.created",
        entityType: "cohort",
        entityId: cohort.id,
        metadata: {
          workshopId: cohort.workshopId,
          name: cohort.name,
          slug: cohort.slug,
          status: cohort.status,
        },
      },
    });

    revalidatePath("/admin/cohorts");
    revalidatePath("/admin/workshops");

    return {
      message: "Cohort berhasil dibuat.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Slug cohort sudah digunakan.",
        errors: {
          slug: ["Slug cohort sudah digunakan."],
        },
      };
    }

    console.error("Failed to create cohort:", error);

    return {
      message: "Gagal membuat cohort.",
    };
  }
}

export async function updateCohortAction(
  cohortId: string,
  _prevState: CohortFormState,
  formData: FormData,
): Promise<CohortFormState> {
  const actor = await requireAdmin();

  const parsed = cohortFormSchema.safeParse({
    workshopId: formData.get("workshopId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    status: formData.get("status"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data cohort.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

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
    const cohort = await prisma.cohort.update({
      where: {
        id: cohortId,
      },
      data: {
        workshopId: data.workshopId,
        name: data.name,
        slug,
        status: data.status,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "cohort.updated",
        entityType: "cohort",
        entityId: cohort.id,
        metadata: {
          workshopId: cohort.workshopId,
          name: cohort.name,
          slug: cohort.slug,
          status: cohort.status,
        },
      },
    });

    revalidatePath("/admin/cohorts");
    revalidatePath(`/admin/cohorts/${cohortId}/edit`);

    return {
      message: "Cohort berhasil diperbarui.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Slug cohort sudah digunakan.",
        errors: {
          slug: ["Slug cohort sudah digunakan."],
        },
      };
    }

    console.error("Failed to update cohort:", error);

    return {
      message: "Gagal memperbarui cohort.",
    };
  }
}
