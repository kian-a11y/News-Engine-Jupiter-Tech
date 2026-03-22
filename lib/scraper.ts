import Parser from "rss-parser";
import { getServiceClient } from "./supabase";
import { ScrapeResult } from "./types";
import { deduplicateItems } from "./dedup";

// ─── TIER 1: Core FX News ───────────────────────────────────────
const FX_SOURCES = [
  { name: "FXStreet", rss: "https://www.fxstreet.com/rss" },
  { name: "Investing.com", rss: "https://www.investing.com/rss/news.rss" },
  { name: "BabyPips", rss: "https://www.babypips.com/feed" },
  { name: "ForexLive", rss: "https://www.forexlive.com/feed" },
  { name: "FX News (Google)", rss: "https://news.google.com/rss/search?q=forex+OR+%22currency+market%22+OR+%22exchange+rate%22+trading&hl=en-US&gl=US&ceid=US:en" },
];

// ─── TIER 2: Central Banks & Institutions ───────────────────────
const INSTITUTIONAL_SOURCES = [
  { name: "Federal Reserve", rss: "https://www.federalreserve.gov/feeds/press_all.xml" },
  { name: "ECB", rss: "https://www.ecb.europa.eu/rss/press.html" },
  { name: "Bank of England", rss: "https://www.bankofengland.co.uk/rss/news" },
];

// ─── TIER 3: Market-Moving Figures (Google News targeted feeds) ─
// These pull real-time news about the people whose statements move markets
const MARKET_MOVERS_SOURCES = [
  // Central bankers — their words directly move FX
  {
    name: "Central Bankers",
    rss: "https://news.google.com/rss/search?q=%22Jerome+Powell%22+OR+%22Christine+Lagarde%22+OR+%22Kazuo+Ueda%22+OR+%22Andrew+Bailey%22+rate+OR+inflation+OR+policy&hl=en-US&gl=US&ceid=US:en",
  },
  // World leaders — geopolitics drives volatility
  {
    name: "World Leaders & Geopolitics",
    rss: "https://news.google.com/rss/search?q=%22White+House%22+OR+%22Xi+Jinping%22+OR+%22Putin%22+tariff+OR+sanctions+OR+trade+OR+war&hl=en-US&gl=US&ceid=US:en",
  },
  // CEOs who move indices and sentiment
  {
    name: "Market-Moving CEOs",
    rss: "https://news.google.com/rss/search?q=%22Elon+Musk%22+OR+%22Jamie+Dimon%22+OR+%22Warren+Buffett%22+OR+%22Jensen+Huang%22+OR+%22Tim+Cook%22+OR+%22Larry+Fink%22+stock+OR+market+OR+earnings&hl=en-US&gl=US&ceid=US:en",
  },
  // Treasury / fiscal policy
  {
    name: "US Treasury & Fiscal",
    rss: "https://news.google.com/rss/search?q=%22Janet+Yellen%22+OR+%22Treasury+Secretary%22+OR+%22debt+ceiling%22+fiscal+OR+bond+OR+dollar&hl=en-US&gl=US&ceid=US:en",
  },
  // OPEC & energy — drives oil-linked FX pairs
  {
    name: "OPEC & Energy",
    rss: "https://news.google.com/rss/search?q=OPEC+OR+%22oil+production%22+OR+%22energy+crisis%22+crude+OR+barrel&hl=en-US&gl=US&ceid=US:en",
  },
];

// ─── TIER 4: Broad Market & Business News ───────────────────────
const BROAD_SOURCES = [
  { name: "Yahoo Finance", rss: "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^DJI,^GSPC,^IXIC&region=US&lang=en-US" },
  { name: "CNBC", rss: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { name: "BBC Business", rss: "https://feeds.bbci.co.uk/news/business/rss.xml" },
  { name: "IMF & Global Economy", rss: "https://news.google.com/rss/search?q=%22IMF%22+OR+%22World+Bank%22+OR+%22global+economy%22+OR+%22recession%22+GDP&hl=en-US&gl=US&ceid=US:en" },
];

const ALL_SOURCES = [
  ...FX_SOURCES,
  ...INSTITUTIONAL_SOURCES,
  ...MARKET_MOVERS_SOURCES,
  ...BROAD_SOURCES,
];

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function truncate(text: string, maxLength: number = 5000): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export async function scrapeAllFeeds(): Promise<ScrapeResult> {
  const supabase = getServiceClient();
  const parser = new Parser({
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 (compatible; FXNewsEngine/1.0)" },
  });
  const failed: string[] = [];

  // Step 1: Collect all items from all sources
  const allRawItems: {
    title: string;
    content: string;
    url: string | null;
    source_name: string;
    published_at: string;
  }[] = [];

  for (const source of ALL_SOURCES) {
    try {
      console.log(`[Scraper] Fetching: ${source.name}`);
      const feed = await parser.parseURL(source.rss);

      // Google News aggregates from many sources — allow more items to cast a wider net
      const isGoogleNews = source.rss.includes("news.google.com");
      const sourceCap = isGoogleNews ? 30 : 20;
      const items = (feed.items || []).slice(0, sourceCap).map((item) => ({
        title: item.title?.trim() || "Untitled",
        content: truncate(
          stripHtml(item.contentSnippet || item.content || item.summary || "")
        ),
        url: item.link || null,
        source_name: source.name,
        published_at: item.isoDate || item.pubDate || new Date().toISOString(),
      }));

      allRawItems.push(...items);
      console.log(`[Scraper] ${source.name}: ${items.length} items fetched`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Scraper] Failed ${source.name}:`, msg);
      failed.push(`${source.name} (${msg})`);
    }
  }

  // Step 2: Deduplicate across all sources
  const deduplicated = deduplicateItems(allRawItems);
  console.log(
    `[Scraper] Dedup: ${allRawItems.length} raw → ${deduplicated.length} unique`
  );

  // Step 3: Batch upsert deduplicated items
  let success = 0;
  const BATCH_SIZE = 50;
  for (let i = 0; i < deduplicated.length; i += BATCH_SIZE) {
    const batch = deduplicated.slice(i, i + BATCH_SIZE).map((item) => ({
      title: item.title,
      content: item.content,
      url: item.url,
      source_name: item.source_name,
      published_at: item.published_at,
      alternative_sources: item.alternative_sources,
    }));

    const { error } = await supabase
      .from("news_items")
      .upsert(batch, { onConflict: "url", ignoreDuplicates: true });

    if (error) {
      console.error(`[Scraper] DB batch error:`, error.message);
      failed.push(`batch_${i} (db: ${error.message})`);
    } else {
      success += batch.length;
    }
  }

  console.log(
    `[Scraper] Done. ${success} unique items stored, ${failed.length} failures, ${ALL_SOURCES.length} sources`
  );
  return { success, failed, total: ALL_SOURCES.length };
}
