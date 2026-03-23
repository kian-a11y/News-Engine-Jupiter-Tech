import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEmailDomain, isDomainApproved } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";

const ensureUserLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = ensureUserLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json({ ok: false, reason: "rate_limited" }, { status: 429 });
  }

  // Validate domain is approved before creating user
  const domain = getEmailDomain(email);
  const approved = await isDomainApproved(domain);
  if (!approved) {
    return NextResponse.json({ ok: false, reason: "domain_not_approved" }, { status: 403 });
  }

  // Domain approved — pre-create user so signInWithOtp sends magic link
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  // Ignore errors — if user already exists, that's fine
  return NextResponse.json({ ok: true });
}
