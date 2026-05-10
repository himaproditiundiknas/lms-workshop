"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { completeProfileSchema } from "@/lib/profile/schema";

export type CompleteProfileFormState = {
  message?: string;
  errors?: {
    fullName?: string[];
    nim?: string[];
    programStudy?: string[];
    semester?: string[];
    phone?: string[];
  };
};

export async function completeProfileAction(
  _prevState: CompleteProfileFormState,
  formData: FormData,
): Promise<CompleteProfileFormState> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return {
      message: "Session tidak valid. Silakan login ulang.",
    };
  }

  const parsed = completeProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    nim: formData.get("nim"),
    programStudy: formData.get("programStudy"),
    semester: formData.get("semester"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kembali data profil kamu.",
    };
  }

  const email = user.email.toLowerCase();
  const data = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!existingUser) {
    return {
      message: "Data user belum ditemukan. Silakan login ulang.",
    };
  }

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      profile: {
        upsert: {
          create: {
            fullName: data.fullName,
            nim: data.nim,
            programStudy: data.programStudy,
            semester: data.semester,
            phone: data.phone,
            profileCompletedAt: new Date(),
          },
          update: {
            fullName: data.fullName,
            nim: data.nim,
            programStudy: data.programStudy,
            semester: data.semester,
            phone: data.phone,
            profileCompletedAt: new Date(),
          },
        },
      },
    },
  });

  redirect("/redeem-invitation");
}
