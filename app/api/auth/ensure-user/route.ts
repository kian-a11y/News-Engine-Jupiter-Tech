import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Use service role to pre-create user so signInWithOtp sends a magic link
  // instead of a "Confirm your signup" email
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.auth.admin.createUser({
    email,
    email_confirm: true, // Mark as verified — skip confirmation flow
  });

  // Ignore errors — if user already exists, that's fine (the goal is achieved)
  return NextResponse.json({ ok: true });
}
