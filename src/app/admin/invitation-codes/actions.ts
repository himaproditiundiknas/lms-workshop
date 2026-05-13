"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import {
  generateInvitationCode,
  hashInvitationCode,
} from "@/lib/invitation/code";
import { createInvitationCodeSchema } from "@/lib/invitation/schema";

export type CreateInvitationCodeState = {
  message?: string;
  plainCode?: string;
  errors?: {
    scope?: string[];
    targetId?: string[];
    maxUses?: string[];
    expiresAt?: string[];
  };
};

export async function createInvitationCodeAction(
  _prevState: CreateInvitationCodeState,
  formData: FormData,
): Promise<CreateInvitationCodeState> {
  const actor = await requireSuperAdmin();

  const parsed = createInvitationCodeSchema.safeParse({
    scope: formData.get("scope"),
    targetId: formData.get("targetId"),
    maxUses: formData.get("maxUses"),
    expiresAt: formData.get("expiresAt"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali data invitation code.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const plainCode = generateInvitationCode();
    const codeHash = hashInvitationCode(plainCode);

    try {
      await prisma.$transaction(async (tx) => {
        const invitationCode = await tx.invitationCode.create({
          data: {
            codeHash,
            scope: data.scope,
            targetId: data.targetId,
            maxUses: data.maxUses,
            expiresAt: data.expiresAt,
            createdById: actor.id,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: actor.id,
            action: "invitation_code.created",
            entityType: "invitation_code",
            entityId: invitationCode.id,
            metadata: {
              scope: data.scope,
              targetId: data.targetId,
              maxUses: data.maxUses,
              expiresAt: data.expiresAt?.toISOString() ?? null,
            },
          },
        });
      });

      revalidatePath("/admin/invitation-codes");

      return {
        message:
          "Invitation code berhasil dibuat. Simpan kode ini sekarang karena hanya ditampilkan sekali.",
        plainCode,
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2002"
      ) {
        continue;
      }

      console.error("Failed to create invitation code:", error);

      return {
        message: "Gagal membuat invitation code.",
      };
    }
  }

  return {
    message: "Gagal membuat kode unik. Coba lagi.",
  };
}

export async function revokeInvitationCodeAction(formData: FormData) {
  const actor = await requireSuperAdmin();
  const invitationCodeId = String(formData.get("invitationCodeId") ?? "");

  if (!invitationCodeId) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const invitationCode = await tx.invitationCode.update({
      where: {
        id: invitationCodeId,
      },
      data: {
        status: "REVOKED",
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: "invitation_code.revoked",
        entityType: "invitation_code",
        entityId: invitationCode.id,
        metadata: {
          previousStatus: invitationCode.status,
          scope: invitationCode.scope,
          targetId: invitationCode.targetId,
        },
      },
    });
  });

  revalidatePath("/admin/invitation-codes");
}
