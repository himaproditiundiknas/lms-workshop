"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hashInvitationCode } from "@/lib/invitation/code";
import { redeemInvitationCodeSchema } from "@/lib/invitation/schema";

export type RedeemInvitationState = {
  message?: string;
  errors?: {
    code?: string[];
  };
};

type RedeemResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
      errors?: RedeemInvitationState["errors"];
    };

export async function redeemInvitationCodeAction(
  _prevState: RedeemInvitationState,
  formData: FormData,
): Promise<RedeemInvitationState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const parsed = redeemInvitationCodeSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return {
      message: "Periksa kembali kode undangan.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = user.email.toLowerCase();
  const codeHash = hashInvitationCode(parsed.data.code);
  const now = new Date();

  let result: RedeemResult;

  try {
    result = await prisma.$transaction(async (tx) => {
      const appUser = await tx.user.findUnique({
        where: {
          email,
        },
        include: {
          profile: true,
        },
      });

      if (!appUser) {
        return {
          ok: false,
          message: "Data user belum ditemukan. Silakan login ulang.",
        };
      }

      if (!appUser.profile?.profileCompletedAt) {
        return {
          ok: false,
          message: "Lengkapi profil terlebih dahulu sebelum redeem kode.",
        };
      }

      const invitationCode = await tx.invitationCode.findUnique({
        where: {
          codeHash,
        },
      });

      if (!invitationCode) {
        return {
          ok: false,
          message: "Kode undangan tidak valid.",
          errors: {
            code: ["Kode undangan tidak ditemukan."],
          },
        };
      }

      if (invitationCode.status !== "ACTIVE") {
        return {
          ok: false,
          message: "Kode undangan sudah tidak aktif.",
          errors: {
            code: ["Kode undangan sudah tidak aktif."],
          },
        };
      }

      if (invitationCode.expiresAt && invitationCode.expiresAt <= now) {
        await tx.invitationCode.update({
          where: {
            id: invitationCode.id,
          },
          data: {
            status: "EXPIRED",
          },
        });

        return {
          ok: false,
          message: "Kode undangan sudah kedaluwarsa.",
          errors: {
            code: ["Kode undangan sudah kedaluwarsa."],
          },
        };
      }

      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          userId_scope_targetId: {
            userId: appUser.id,
            scope: invitationCode.scope,
            targetId: invitationCode.targetId,
          },
        },
      });

      if (existingEnrollment) {
        return {
          ok: true,
        };
      }

      const quotaUpdate = await tx.invitationCode.updateMany({
        where: {
          id: invitationCode.id,
          status: "ACTIVE",
          usedCount: {
            lt: invitationCode.maxUses,
          },
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gt: now,
              },
            },
          ],
        },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      if (quotaUpdate.count === 0) {
        return {
          ok: false,
          message: "Kuota kode undangan sudah habis.",
          errors: {
            code: ["Kuota kode undangan sudah habis."],
          },
        };
      }

      const enrollment = await tx.enrollment.create({
        data: {
          userId: appUser.id,
          invitationCodeId: invitationCode.id,
          scope: invitationCode.scope,
          targetId: invitationCode.targetId,
          status: "PENDING",
        },
      });

      await tx.invitationRedemption.create({
        data: {
          invitationCodeId: invitationCode.id,
          userId: appUser.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: appUser.id,
          action: "invitation_code.redeemed",
          entityType: "enrollment",
          entityId: enrollment.id,
          metadata: {
            invitationCodeId: invitationCode.id,
            scope: invitationCode.scope,
            targetId: invitationCode.targetId,
          },
        },
      });

      return {
        ok: true,
      };
    });
  } catch (error) {
    console.error("Failed to redeem invitation code:", error);

    return {
      message: "Gagal redeem kode undangan. Coba lagi.",
    };
  }

  if (!result.ok) {
    return {
      message: result.message,
      errors: result.errors,
    };
  }

  redirect("/pending-approval");
}
