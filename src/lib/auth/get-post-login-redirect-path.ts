import { prisma } from "@/lib/prisma";

export async function getPostLoginRedirectPath(email: string) {
  const appUser = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
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

  if (!appUser) {
    return "/complete-profile";
  }

  if (!appUser.profile?.profileCompletedAt) {
    return "/complete-profile";
  }

  const roleNames = appUser.roles.map((userRole) => userRole.role.name);

  if (
    roleNames.includes("super_admin") ||
    roleNames.includes("admin_program")
  ) {
    return "/admin";
  }

  if (roleNames.includes("mentor")) {
    return "/mentor";
  }

  return "/dashboard";
}
