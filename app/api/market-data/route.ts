import { getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category"); // fx, crypto, index, commodity, bond, stock
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 400);

    const supabase = getServiceClient();

    let query = supabase
      .from("market_data")
      .select("symbol, name, category, current_price, daily_open, daily_high, daily_low, daily_change_pct, previous_close, ma_50, ma_200, updated_at")
      .not("current_price", "is", null)
      .order("symbol");

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error("[MarketData API] Error:", error);
      return Response.json({ error: "Failed to load market data" }, { status: 500 });
    }

    return Response.json({
      data: data || [],
      count: data?.length || 0,
    });
  } catch (err) {
    console.error("[MarketData API] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
