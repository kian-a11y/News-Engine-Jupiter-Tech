import { getServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getServiceClient();

    const [{ data: news }, { data: market }] = await Promise.all([
      supabase.from("news_items").select("scraped_at").order("scraped_at", { ascending: false }).limit(1),
      supabase.from("market_data").select("updated_at").order("updated_at", { ascending: false }).limit(1),
    ]);

    return Response.json({
      newsScrapedAt: news?.[0]?.scraped_at || null,
      marketUpdatedAt: market?.[0]?.updated_at || null,
    });
  } catch {
    return Response.json({ newsScrapedAt: null, marketUpdatedAt: null });
  }
}
