import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Resend } from "resend";
import { inviteLimiter } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { emails } = body;

  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "No emails provided" }, { status: 400 });
  }

  const cookieStore = await cookies();

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

  // Rate limit: 3 invite batches per hour per user
  const { allowed } = inviteLimiter.check(user.email || user.id);
  if (!allowed) {
    return NextResponse.json(
      { error: "You've sent too many invites recently. Please try again later." },
      { status: 429 }
    );
  }

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = emails.slice(0, 5).filter((e) => emailRegex.test(e));

  if (validEmails.length === 0) {
    return NextResponse.json(
      { error: "No valid emails provided" },
      { status: 400 }
    );
  }

  const invited: string[] = [];
  const failed: string[] = [];
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://fx-news-engine.vercel.app";
  const safeInviterEmail = escapeHtml(user.email || "A colleague");

  for (const email of validEmails) {
    try {
      // Log invitation to DB
      await serviceClient.from("invitations").insert({
        inviter_id: user.id,
        inviter_email: user.email,
        invitee_email: email,
      });

      // Send via Resend
      await resend.emails.send({
        from: "FX News Engine <noreply@jupitertech.io>",
        to: email,
        subject: `${safeInviterEmail} invited you to Jupiter Tech's FX News Engine`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:48px 24px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:16px;border:1px solid #27272a;padding:40px;">
        <tr><td>
          <!-- Logo -->
          <div style="margin-bottom:32px;">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#f0b429,#ea580c);display:inline-flex;align-items:center;justify-content:center;">
              <span style="font-weight:700;color:#0a0a0f;font-size:20px;">J</span>
            </div>
            <p style="color:#52525b;font-size:11px;margin:8px 0 0;letter-spacing:0.05em;text-transform:uppercase;">Jupiter Tech · FX News Engine</p>
          </div>

          <!-- Heading -->
          <h1 style="color:#f5f5f5;font-size:22px;font-weight:600;margin:0 0 12px;">You've been invited</h1>
          <p style="color:#a1a1aa;font-size:15px;line-height:1.6;margin:0 0 28px;">
            <strong style="color:#f0b429;">${safeInviterEmail}</strong> has invited you to access the
            <strong style="color:#f5f5f5;">FX News Engine</strong> — real-time FX market intelligence
            built for CFD brokers and trading desks.
          </p>

          <!-- What it does -->
          <div style="background:#0a0a0f;border:1px solid #27272a;border-radius:10px;padding:20px;margin-bottom:28px;">
            <p style="color:#71717a;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;margin:0 0 12px;">What you get</p>
            <ul style="color:#a1a1aa;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
              <li>Live FX news from 17 global sources</li>
              <li>AI chat to turn news into market briefs</li>
              <li>Social posts, risk alerts &amp; trade ideas</li>
              <li>Updated every 2 hours, automatically</li>
            </ul>
          </div>

          <!-- CTA -->
          <a href="${appUrl}/login"
             style="display:inline-block;background:#f0b429;color:#0a0a0f;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
            Get Access →
          </a>

          <!-- Footer -->
          <p style="color:#3f3f46;font-size:12px;margin-top:36px;margin-bottom:0;">
            Powered by Jupiter Tech · You received this because ${safeInviterEmail} entered your email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });

      invited.push(email);
    } catch (err) {
      console.error("[Invite] Failed to invite", email, err);
      failed.push(email);
    }
  }

  return NextResponse.json({ success: true, invited, failed });
}
