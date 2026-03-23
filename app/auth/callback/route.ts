import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const origin = req.nextUrl.origin;

  // No code — direct visit or malformed link
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  // Determine redirect destination based on onboarding status
  const hasOnboarded = req.cookies.get("jt_ob")?.value === "1";
  const destination = hasOnboarded ? "/" : "/onboarding";

  // Build redirect response FIRST — cookies will be attached to it
  const response = NextResponse.redirect(new URL(destination, origin));

  // Create server client with cookie adapter that writes to the response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Exchange PKCE code for session — triggers setAll() above
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Code expired, already used, or invalid
    return NextResponse.redirect(
      new URL("/login?error=invalid_link", origin)
    );
  }

  // Success: response carries both the redirect AND Set-Cookie headers
  return response;
}
