import { getServiceClient } from "@/lib/supabase";
import { fetchNewsForRange } from "@/lib/news-query";
import { rankByImpact } from "@/lib/impact-score";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get("from") || new Date().toISOString().split("T")[0];
    const to = url.searchParams.get("to") || new Date().toISOString().split("T")[0];

    const supabase = getServiceClient();

    // Fetch a larger pool (100) then rank by impact and return top 12
    const pool = await fetchNewsForRange(supabase, from, to, 100);
    const topHeadlines = rankByImpact(pool, 12);

    return Response.json({
      headlines: topHeadlines.map((item) => ({
        id: item.id,
        title: item.title,
        source_name: item.source_name,
        published_at: item.published_at,
        url: item.url,
        alternative_sources: item.alternative_sources || [],
      })),
    });
  } catch (err) {
    console.error("[Headlines] Error:", err);
    return Response.json({ headlines: [] }, { status: 500 });
  }
}
