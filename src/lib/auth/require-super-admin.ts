import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function requireSuperAdmin() {
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

  const isSuperAdmin = appUser.roles.some(
    (userRole) => userRole.role.name === "super_admin",
  );

  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  return appUser;
}
