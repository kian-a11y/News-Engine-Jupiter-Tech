import { createAccessRequest, getEmailDomain } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  try {
    const { name, email, company, role } = await req.json();

    if (!name || !email) {
      return Response.json({ error: "Name and email required" }, { status: 400 });
    }

    // Check for existing pending request from this email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await supabase
      .from("access_requests")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existing) {
      // Already submitted — return success silently
      return Response.json({ success: true });
    }

    // Save the request
    const result = await createAccessRequest({ name, email, company, role });

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }

    const domain = getEmailDomain(email);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company || "Not provided");
    const safeRole = escapeHtml(role || "Not provided");
    const safeDomain = escapeHtml(domain);

    // Notify Kian via email
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "FX News Engine <notifications@jupitertech.io>",
          to: "kian@jupitertech.io",
          subject: `New Access Request: ${safeName} from ${safeCompany}`,
          html: `
            <h2>New Access Request</h2>
            <table style="border-collapse:collapse;font-family:sans-serif;">
              <tr><td style="padding:8px;font-weight:bold;">Name:</td><td style="padding:8px;">${safeName}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;">${safeEmail}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Company:</td><td style="padding:8px;">${safeCompany}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Role:</td><td style="padding:8px;">${safeRole}</td></tr>
              <tr><td style="padding:8px;font-weight:bold;">Domain:</td><td style="padding:8px;">${safeDomain}</td></tr>
            </table>
            <br/>
            <p>To approve, add domain <strong>${safeDomain}</strong> to the <code>approved_domains</code> table in Supabase.</p>
          `,
        });
      } catch (emailErr) {
        console.error("[Auth] Email notification failed:", emailErr);
      }
    } else {
      console.log(`[Auth] Access request from ${name} (${email}) at ${company} — no RESEND_API_KEY set, skipping email`);
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
