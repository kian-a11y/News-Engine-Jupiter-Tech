import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: static assets, auth routes, public API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".ico") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/scrape") ||
    pathname.startsWith("/api/cleanup")
  ) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie (set by createBrowserClient via @supabase/ssr)
  const allCookies = req.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (cookie) =>
      cookie.name.includes("auth-token") ||
      (cookie.name.includes("sb-") && cookie.name.includes("-auth"))
  );

  if (!hasAuthCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Authenticated — check if onboarding is complete
  // jt_ob cookie is set by /api/auth/onboard after user completes consent flow
  const hasOnboarded = req.cookies.get("jt_ob")?.value === "1";

  if (!hasOnboarded && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Already onboarded and trying to visit /onboarding → send to home
  if (hasOnboarded && pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
