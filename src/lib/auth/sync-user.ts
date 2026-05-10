import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

export async function syncSupabaseUserToDatabase(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email?.toLowerCase();

  if (!email) {
    throw new Error("Google account does not provide an email address");
  }

  const googleIdentity = supabaseUser.identities?.find(
    (identity) => identity.provider === "google",
  );

  const identityData = googleIdentity?.identity_data ?? {};
  const metadata = supabaseUser.user_metadata ?? {};

  const googleSub =
    readString(identityData.sub) ??
    readString(metadata.sub) ??
    readString(supabaseUser.id);

  const fullName =
    readString(metadata.full_name) ??
    readString(metadata.name) ??
    readString(identityData.full_name) ??
    readString(identityData.name);

  const avatarUrl =
    readString(metadata.avatar_url) ??
    readString(metadata.picture) ??
    readString(identityData.avatar_url) ??
    readString(identityData.picture);

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: {
        email,
      },
      update: {
        ...(googleSub ? { googleSub } : {}),
        status: "ACTIVE",
        profile: {
          upsert: {
            update: {
              ...(fullName ? { fullName } : {}),
              ...(avatarUrl ? { avatarUrl } : {}),
            },
            create: {
              fullName: fullName ?? null,
              avatarUrl: avatarUrl ?? null,
            },
          },
        },
      },
      create: {
        email,
        ...(googleSub ? { googleSub } : {}),
        status: "ACTIVE",
        profile: {
          create: {
            fullName: fullName ?? null,
            avatarUrl: avatarUrl ?? null,
          },
        },
      },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    const participantRole = await tx.role.findUnique({
      where: {
        name: "participant",
      },
    });

    const alreadyHasParticipantRole = user.roles.some(
      (userRole) => userRole.role.name === "participant",
    );

    if (participantRole && !alreadyHasParticipantRole) {
      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: participantRole.id,
        },
      });
    }

    return await tx.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  });
}
