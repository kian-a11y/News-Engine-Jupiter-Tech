import { createClient } from "@supabase/supabase-js";

export function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() || "";
}

export async function isDomainApproved(domain: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("approved_domains")
    .select("id")
    .eq("domain", domain.toLowerCase())
    .single();

  return !!data;
}

export async function createAccessRequest(params: {
  name: string;
  email: string;
  company: string;
  role: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from("access_requests").insert({
    name: params.name,
    email: params.email,
    company: params.company,
    role: params.role,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
