"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMentorOrAdmin } from "@/lib/auth/require-mentor-or-admin";
import { slugify } from "@/lib/workshop/slug";
import {
  projectGroupFormSchema,
  projectGroupIdSchema,
  projectGroupMemberFormSchema,
  projectGroupMemberIdSchema,
} from "@/lib/project-group/schema";

export type ProjectGroupFormState = {
  message?: string;
  errors?: {
    cohortId?: string[];
    mentorId?: string[];
    name?: string[];
    slug?: string[];
    title?: string[];
    description?: string[];
    repositoryUrl?: string[];
    deploymentUrl?: string[];
    status?: string[];
  };
};

export type ProjectGroupMemberFormState = {
  message?: string;
  errors?: {
    projectGroupId?: string[];
    userId?: string[];
    role?: string[];
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

export async function createProjectGroupAction(
  _prevState: ProjectGroupFormState,
  formData: FormData,
): Promise<ProjectGroupFormState> {
  const actor = await requireMentorOrAdmin();

  const parsed = projectGroupFormSchema.safeParse({
    cohortId: formData.get("cohortId"),
    mentorId: formData.get("mentorId"),
    name: formData.get("name"),
    slug: formData.get("slug"),
    title: formData.get("title"),
    description: formData.get("description"),
    repositoryUrl: formData.get("repositoryUrl"),
    deploymentUrl: formData.get("deploymentUrl"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data project group.",
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

  if (data.mentorId) {
    const mentor = await prisma.user.findUnique({
      where: {
        id: data.mentorId,
      },
    });

    if (!mentor) {
      return {
        message: "Mentor tidak ditemukan.",
        errors: {
          mentorId: ["Mentor tidak ditemukan."],
        },
      };
    }
  }

  try {
    const projectGroup = await prisma.projectGroup.create({
      data: {
        cohortId: data.cohortId,
        createdById: actor.id,
        mentorId: data.mentorId ?? null,
        name: data.name,
        slug,
        title: data.title || null,
        description: data.description || null,
        repositoryUrl: data.repositoryUrl ?? null,
        deploymentUrl: data.deploymentUrl ?? null,
        status: data.status,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "project_group.created",
        entityType: "project_group",
        entityId: projectGroup.id,
        metadata: {
          cohortId: projectGroup.cohortId,
          cohortName: cohort.name,
          workshopId: cohort.workshopId,
          workshopTitle: cohort.workshop.title,
          mentorId: projectGroup.mentorId,
          name: projectGroup.name,
          slug: projectGroup.slug,
          title: projectGroup.title,
          status: projectGroup.status,
        },
      },
    });

    revalidatePath("/mentor/project-groups");

    return {
      message: "Project group berhasil dibuat.",
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Slug project group sudah digunakan di cohort ini.",
        errors: {
          slug: ["Slug project group sudah digunakan di cohort ini."],
        },
      };
    }

    console.error("Failed to create project group:", error);

    return {
      message: "Gagal membuat project group.",
    };
  }
}

export async function addProjectGroupMemberAction(
  _prevState: ProjectGroupMemberFormState,
  formData: FormData,
): Promise<ProjectGroupMemberFormState> {
  const actor = await requireMentorOrAdmin();

  const parsed = projectGroupMemberFormSchema.safeParse({
    projectGroupId: formData.get("projectGroupId"),
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data member.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { projectGroupId, userId, role } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const projectGroup = await tx.projectGroup.findUnique({
        where: {
          id: projectGroupId,
        },
        include: {
          cohort: {
            include: {
              workshop: true,
            },
          },
        },
      });

      if (!projectGroup) {
        return {
          ok: false,
          message: "Project group tidak ditemukan.",
        };
      }

      if (projectGroup.status !== "ACTIVE") {
        return {
          ok: false,
          message: "Member hanya bisa diubah saat project group ACTIVE.",
        };
      }

      const approvedEnrollment = await tx.enrollment.findFirst({
        where: {
          userId,
          cohortId: projectGroup.cohortId,
          status: "APPROVED",
        },
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      });

      if (!approvedEnrollment) {
        return {
          ok: false,
          message: "User belum approved di cohort project group ini.",
        };
      }

      const existingMemberInCohort = await tx.projectGroupMember.findUnique({
        where: {
          cohortId_userId: {
            cohortId: projectGroup.cohortId,
            userId,
          },
        },
        include: {
          projectGroup: true,
        },
      });

      if (
        existingMemberInCohort &&
        existingMemberInCohort.projectGroupId !== projectGroup.id
      ) {
        return {
          ok: false,
          message: `Peserta sudah masuk group ${existingMemberInCohort.projectGroup.name}.`,
        };
      }

      if (role === "LEADER") {
        await tx.projectGroupMember.updateMany({
          where: {
            projectGroupId: projectGroup.id,
            role: "LEADER",
          },
          data: {
            role: "MEMBER",
          },
        });
      }

      const member = await tx.projectGroupMember.upsert({
        where: {
          projectGroupId_userId: {
            projectGroupId: projectGroup.id,
            userId,
          },
        },
        update: {
          role,
        },
        create: {
          projectGroupId: projectGroup.id,
          cohortId: projectGroup.cohortId,
          userId,
          role,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "project_group.member_added",
          entityType: "project_group_member",
          entityId: member.id,
          metadata: {
            projectGroupId: projectGroup.id,
            projectGroupName: projectGroup.name,
            cohortId: projectGroup.cohortId,
            cohortName: projectGroup.cohort.name,
            workshopId: projectGroup.cohort.workshopId,
            workshopTitle: projectGroup.cohort.workshop.title,
            userId,
            userEmail: approvedEnrollment.user.email,
            userName: approvedEnrollment.user.profile?.fullName ?? null,
            role,
          },
        },
      });

      return {
        ok: true,
        message: "Member project group berhasil disimpan.",
      };
    });

    revalidatePath("/mentor/project-groups");

    return {
      message: result.message,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        message: "Peserta sudah menjadi member project group di cohort ini.",
        errors: {
          userId: ["Peserta sudah menjadi member project group di cohort ini."],
        },
      };
    }

    console.error("Failed to add project group member:", error);

    return {
      message: "Gagal menyimpan member project group.",
    };
  }
}

export async function removeProjectGroupMemberAction(formData: FormData) {
  const actor = await requireMentorOrAdmin();

  const parsed = projectGroupMemberIdSchema.safeParse({
    memberId: formData.get("memberId"),
  });

  if (!parsed.success) {
    return;
  }

  const member = await prisma.projectGroupMember.findUnique({
    where: {
      id: parsed.data.memberId,
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      projectGroup: {
        include: {
          cohort: {
            include: {
              workshop: true,
            },
          },
        },
      },
    },
  });

  if (!member || member.projectGroup.status !== "ACTIVE") {
    return;
  }

  await prisma.projectGroupMember.delete({
    where: {
      id: member.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: "project_group.member_removed",
      entityType: "project_group_member",
      entityId: member.id,
      metadata: {
        projectGroupId: member.projectGroupId,
        projectGroupName: member.projectGroup.name,
        cohortId: member.cohortId,
        cohortName: member.projectGroup.cohort.name,
        workshopId: member.projectGroup.cohort.workshopId,
        workshopTitle: member.projectGroup.cohort.workshop.title,
        userId: member.userId,
        userEmail: member.user.email,
        userName: member.user.profile?.fullName ?? null,
        role: member.role,
      },
    },
  });

  revalidatePath("/mentor/project-groups");
}

export async function lockProjectGroupAction(formData: FormData) {
  await updateProjectGroupStatus(formData, "LOCKED");
}

export async function activateProjectGroupAction(formData: FormData) {
  await updateProjectGroupStatus(formData, "ACTIVE");
}

export async function archiveProjectGroupAction(formData: FormData) {
  await updateProjectGroupStatus(formData, "ARCHIVED");
}

async function updateProjectGroupStatus(
  formData: FormData,
  status: "ACTIVE" | "LOCKED" | "ARCHIVED",
) {
  const actor = await requireMentorOrAdmin();

  const parsed = projectGroupIdSchema.safeParse({
    projectGroupId: formData.get("projectGroupId"),
  });

  if (!parsed.success) {
    return;
  }

  const projectGroup = await prisma.projectGroup.update({
    where: {
      id: parsed.data.projectGroupId,
    },
    data: {
      status,
    },
    include: {
      cohort: {
        include: {
          workshop: true,
        },
      },
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: actor.id,
      action: `project_group.${status.toLowerCase()}`,
      entityType: "project_group",
      entityId: projectGroup.id,
      metadata: {
        projectGroupId: projectGroup.id,
        projectGroupName: projectGroup.name,
        cohortId: projectGroup.cohortId,
        cohortName: projectGroup.cohort.name,
        workshopId: projectGroup.cohort.workshopId,
        workshopTitle: projectGroup.cohort.workshop.title,
        status,
      },
    },
  });

  revalidatePath("/mentor/project-groups");
}
