import { NextRequest } from "next/server";
import { getEmailDomain, isDomainApproved } from "@/lib/auth";
import { createRateLimiter } from "@/lib/rate-limit";

const checkDomainLimiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const { allowed } = checkDomainLimiter.check(ip);
    if (!allowed) {
      return Response.json({ error: "Too many requests" }, { status: 429 });
    }

    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return Response.json({ error: "Valid email required" }, { status: 400 });
    }

    const domain = getEmailDomain(email);
    const approved = await isDomainApproved(domain);

    return Response.json({ approved, domain });
  } catch {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
