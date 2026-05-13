import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const ADMIN_ROLE_NAMES = new Set(["super_admin", "admin_program"]);

export async function requireAdmin() {
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

  const isAdmin = appUser.roles.some((userRole) =>
    ADMIN_ROLE_NAMES.has(userRole.role.name),
  );

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return appUser;
}
