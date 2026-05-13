import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function requireApprovedWorkshopEnrollment(targetId: string) {
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
  });

  if (!appUser) {
    redirect("/login");
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_scope_targetId: {
        userId: appUser.id,
        scope: "WORKSHOP",
        targetId,
      },
    },
  });

  if (!enrollment) {
    redirect("/redeem-invitation");
  }

  if (enrollment.status === "PENDING") {
    redirect("/pending-approval");
  }

  if (enrollment.status !== "APPROVED") {
    redirect("/redeem-invitation");
  }

  return enrollment;
}
