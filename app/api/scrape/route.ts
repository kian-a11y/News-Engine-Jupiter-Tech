import { scrapeAllFeeds } from "@/lib/scraper";
import { fetchAllMarketData } from "@/lib/market-data";
import { fetchEconomicCalendar } from "@/lib/economic-calendar";
import { scrapeLimiter } from "@/lib/rate-limit";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(authHeader: string | null): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || !authHeader) return false;

  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length) return false;

  try {
    return timingSafeEqual(
      Buffer.from(authHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

async function handleScrape(req: Request) {
  if (!isAuthorized(req.headers.get("authorization"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit scrape calls
  const { allowed } = scrapeLimiter.check("global");
  if (!allowed) {
    return Response.json({ error: "Scrape already running" }, { status: 429 });
  }

  try {
    const [newsResult, marketResult, calendarResult] = await Promise.all([
      scrapeAllFeeds().catch((err) => {
        console.error("[Scrape] News error:", err);
        return { inserted: 0, skipped: 0, failed: [] as string[] };
      }),
      fetchAllMarketData().catch((err) => {
        console.error("[Scrape] Market data error:", err);
        return { success: 0, failed: 0, total: 0 };
      }),
      fetchEconomicCalendar().catch((err) => {
        console.error("[Scrape] Calendar error:", err);
        return { success: 0, failed: 0 };
      }),
    ]);

    return Response.json({
      news: newsResult,
      market_data: marketResult,
      calendar: calendarResult,
    });
  } catch (err) {
    console.error("[Scrape] Error:", err);
    return Response.json({ error: "Scrape failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return handleScrape(req);
}

// Vercel Cron calls GET
export async function GET(req: Request) {
  return handleScrape(req);
}
