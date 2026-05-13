import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_ROLE_NAMES = new Set(["super_admin", "admin_program", "mentor"]);

export async function requireMentorOrAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const appUser = await prisma.user.findUnique({
    where: {
      email: user.email.toLowerCase(),
    },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!appUser) {
    redirect("/login");
  }

  const canAccess = appUser.roles.some((userRole) =>
    ALLOWED_ROLE_NAMES.has(userRole.role.name),
  );

  if (!canAccess) {
    redirect("/dashboard");
  }

  return appUser;
}
