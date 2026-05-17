import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Public routes that do NOT require authentication.
 * Everything else will be checked for a valid Supabase session.
 */
const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  // Static / API health endpoints
  if (pathname.startsWith("/api/health")) {
    return false; // health now requires auth — handled at route level
  }

  return false;
}

export default async function proxy(request: NextRequest) {
  // 1. Refresh Supabase session cookies on every request
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;

  // 2. Skip auth check for public paths
  if (isPublicPath(pathname)) {
    return response;
  }

  // 3. Check for Supabase session cookies to decide if user is logged in.
  //    We look for any sb-* auth cookie. This is a lightweight check;
  //    the actual auth verification happens in requireAdmin / requireMentorOrAdmin etc.
  const hasSessionCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
