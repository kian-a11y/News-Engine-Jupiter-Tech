import { getServiceClient } from "@/lib/supabase";
import { timingSafeEqual } from "crypto";

function isAuthorized(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) return false;
  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getServiceClient();
    const ninetyDaysAgo = new Date(
      Date.now() - 90 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase
      .from("news_items")
      .delete()
      .lt("published_at", ninetyDaysAgo);

    if (error) {
      console.error("[Cleanup] Error:", error.message);
      return Response.json({ error: error.message }, { status: 500 });
    }

    console.log("[Cleanup] Deleted articles older than 90 days");
    return Response.json({ success: true });
  } catch (err) {
    console.error("[Cleanup] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
