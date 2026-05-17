"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostLoginRedirectPath } from "@/lib/auth/get-post-login-redirect-path";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export type PasswordLoginState = {
  message?: string;
  errors?: {
    email?: string[];
    password?: string[];
  };
};

export async function passwordLoginAction(
  _prevState: PasswordLoginState,
  formData: FormData,
): Promise<PasswordLoginState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  const errors: PasswordLoginState["errors"] = {};

  if (!email) {
    errors.email = ["Email wajib diisi."];
  }

  if (!password) {
    errors.password = ["Password wajib diisi."];
  }

  if (Object.keys(errors).length > 0) {
    return {
      message: "Periksa kembali email dan password.",
      errors,
    };
  }

  // Rate limit login attempts per email
  const rateLimitResult = checkRateLimit(email, RATE_LIMITS.login);

  if (!rateLimitResult.allowed) {
    const retrySeconds = Math.ceil(rateLimitResult.retryAfterMs / 1000);

    return {
      message: `Terlalu banyak percobaan login. Coba lagi dalam ${retrySeconds} detik.`,
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message:
        "Email atau password salah, atau akun belum tersedia di Supabase Auth.",
    };
  }

  const redirectPath = await getPostLoginRedirectPath(email);

  redirect(redirectPath);
}
