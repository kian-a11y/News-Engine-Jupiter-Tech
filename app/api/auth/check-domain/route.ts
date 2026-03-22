import { getEmailDomain, isDomainApproved } from "@/lib/auth";

export async function POST(req: Request) {
  try {
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
