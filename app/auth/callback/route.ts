import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "email") as
    | "signup"
    | "magiclink"
    | "email";
  const origin = req.nextUrl.origin;

  const verified = searchParams.get("verified");

  // No auth parameters at all — invalid or malformed link
  if (!code && !token_hash && !verified) {
    return NextResponse.redirect(new URL("/login?error=missing_code", origin));
  }

  // Build a mutable response — cookies will be attached to it
  const response = NextResponse.redirect(new URL("/", origin)); // placeholder destination

  // Create server client for session management (reads/writes cookies on the response)
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

  // ── Handle auth flows ──────────────────────────────────────
  // verified=1: session already established via OTP on login page — skip code exchange
  if (!verified) {
    let authError;

    if (token_hash) {
      const result = await supabase.auth.verifyOtp({ token_hash, type });
      authError = result.error;
    } else if (code) {
      const result = await supabase.auth.exchangeCodeForSession(code);
      authError = result.error;
    }

    if (authError) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_link", origin)
      );
    }
  }

  // ── Determine destination via database, not cookie ──────────────
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_link", origin)
    );
  }

  // Use service role to bypass RLS on user_profiles
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await serviceClient
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .single();

  const hasOnboarded = profile?.onboarding_completed === true;

  if (hasOnboarded) {
    // Refresh the onboarding cookie
    response.cookies.set("jt_ob", "1", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
      path: "/",
    });
    // Rewrite destination to home
    return NextResponse.redirect(new URL("/", origin), {
      headers: response.headers,
    });
  } else {
    // Clear stale cookie if present, send to onboarding
    response.cookies.delete("jt_ob");
    return NextResponse.redirect(new URL("/onboarding", origin), {
      headers: response.headers,
    });
  }
}
