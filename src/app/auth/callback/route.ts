import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { syncSupabaseUserToDatabase } from "@/lib/auth/sync-user";

function redirectToLoginWithError(origin: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);

  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return redirectToLoginWithError(
      requestUrl.origin,
      "Kode login tidak ditemukan.",
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectToLoginWithError(
      requestUrl.origin,
      "Gagal memproses login Google.",
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return redirectToLoginWithError(
      requestUrl.origin,
      "Session login tidak valid.",
    );
  }

  const appUser = await syncSupabaseUserToDatabase(user);

  const isProfileComplete = Boolean(appUser.profile?.profileCompletedAt);

  const redirectPath = isProfileComplete
    ? "/redeem-invitation"
    : "/complete-profile";

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
}
