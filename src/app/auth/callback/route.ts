import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSupabaseUserToDatabase } from "@/lib/auth/sync-user";
import { getPostLoginRedirectPath } from "@/lib/auth/get-post-login-redirect-path";

function redirectToLoginWithError(origin: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectToLoginWithError(origin, "Kode login tidak ditemukan.");
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectToLoginWithError(origin, "Gagal memproses login Google.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return redirectToLoginWithError(origin, "Session login tidak valid.");
  }

  let redirectPath = "/complete-profile";

  try {
    await syncSupabaseUserToDatabase(user);
    redirectPath = await getPostLoginRedirectPath(user.email);
  } catch (error) {
    console.error("Failed to sync authenticated Google user:", error);

    return redirectToLoginWithError(
      origin,
      "Login Google berhasil, tetapi data akun gagal disiapkan. Hubungi admin.",
    );
  }

  return NextResponse.redirect(`${origin}${redirectPath}`);
}
