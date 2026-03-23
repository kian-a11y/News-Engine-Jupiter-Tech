import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { marketing_consent, position, geography, biggest_bottleneck } = body;

  if (typeof marketing_consent !== "boolean") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!position?.trim() || !geography?.trim() || !biggest_bottleneck?.trim()) {
    return NextResponse.json({ error: "All profile fields are required" }, { status: 400 });
  }

  const cookieStore = await cookies();

  // Validate auth with anon key
  const anonClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service role client for DB writes
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  // Capture IP for GDPR/consent audit trail
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const { error: profileError } = await serviceClient
    .from("user_profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        marketing_consent,
        marketing_consent_at: new Date().toISOString(),
        marketing_consent_ip: ip,
        position: position.trim(),
        geography: geography.trim(),
        biggest_bottleneck: biggest_bottleneck.trim(),
        onboarding_completed: true,
      },
      { onConflict: "id" }
    );

  if (profileError) {
    console.error("[Onboard] Profile upsert failed:", profileError.message);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }

  // Set a long-lived cookie so middleware knows onboarding is done
  const response = NextResponse.json({ success: true });
  response.cookies.set("jt_ob", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    httpOnly: true,
  });

  return response;
}
