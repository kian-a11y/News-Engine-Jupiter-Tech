import { NewsItem } from "./types";

// ─── Source Tier Weights ────────────────────────────────────────
// Higher = more useful for brokers creating trader-facing content
const SOURCE_TIERS: Record<string, number> = {
  // Tier 1: Direct FX news — already in broker-friendly language
  "FXStreet": 5,
  "ForexLive": 5,
  "BabyPips": 5, // Excellent for educational content brokers repurpose
  "FX News (Google)": 4,
  "Investing.com": 4,

  // Tier 2: Central banks — rate decisions are the #1 content driver
  "Federal Reserve": 5,
  "ECB": 5,
  "Bank of England": 5,

  // Tier 3: Market movers — their words create content opportunities
  "Central Bankers": 5,
  "World Leaders & Geopolitics": 4,
  "US Treasury & Fiscal": 4,
  "OPEC & Energy": 4,
  "Market-Moving CEOs": 3,

  // Tier 4: Broad news — context, less directly actionable for content
  "CNBC": 3,
  "Yahoo Finance": 3,
  "BBC Business": 2,
  "IMF & Global Economy": 3,
};

// ─── Impact Keywords ────────────────────────────────────────────
// Words that signal stories brokers can turn into compelling trader content
const IMPACT_KEYWORDS = [
  // Central bank / rates — always the top story
  "rate", "rates", "hike", "cut", "hawkish", "dovish", "pivot",
  "inflation", "cpi", "ppi", "nfp", "payroll", "employment", "unemployment",
  "gdp", "recession", "stagflation",

  // FX specific
  "forex", "eur/usd", "gbp/usd", "usd/jpy", "aud/usd", "usd/cad",
  "dollar", "euro", "yen", "sterling", "pound",
  "currency", "exchange rate", "pip",

  // Geopolitical / volatility triggers
  "war", "conflict", "sanctions", "tariff", "trade war", "embargo",
  "oil", "crude", "opec",
  "volatility", "crash", "surge", "plunge", "soar", "tumble",
  "breakout", "resistance", "support",

  // Key figures
  "powell", "lagarde", "bailey", "ueda", "yellen",
  "trump", "xi", "putin",

  // Events
  "fomc", "fed meeting", "ecb meeting", "boe meeting",
  "nonfarm", "jobs report", "cpi report",
  "jackson hole", "davos", "g7", "g20", "opec+",
  "options expiry", "quad witching", "earnings",

  // Content-creation gold: superlatives and surprises
  "record", "highest", "lowest", "all-time", "historic",
  "first time", "unexpected", "surprise", "shock",
  "beat", "miss", "consensus", "forecast",
  "unprecedented", "milestone", "landmark",

  // Opportunity / momentum signals — what makes traders click
  "opportunity", "breakout", "trend", "momentum", "reversal",
  "rally", "sell-off", "correction", "bull", "bear",
  "all-time high", "all-time low", "rebound", "collapse",

  // CFD / regulatory — critical for broker audiences
  "margin", "leverage", "esma", "fca", "asic", "cysec",
  "retail trader", "broker", "cfd", "spread", "regulation",
  "compliance", "short selling", "derivative",
];

/**
 * Score a news item by how useful it is for brokers creating trader-facing content.
 * Higher score = more likely to produce compelling, shareable content.
 */
export function calculateImpactScore(item: NewsItem): number {
  let score = 0;
  const titleLower = (item.title || "").toLowerCase();
  const contentLower = (item.content || "").toLowerCase();

  // 1. Source tier (0-5 points, weighted x2)
  const tierScore = SOURCE_TIERS[item.source_name] || 2;
  score += tierScore * 2;

  // 2. Cross-source coverage (0+ points, weighted x5)
  // More sources reporting = THE story of the day. Brokers MUST cover it.
  const altCount = item.alternative_sources?.length || 0;
  score += altCount * 5;
  // Multiplier: stories covered by 3+ sources are objectively the biggest story
  if (altCount >= 3) {
    score = Math.round(score * 1.5);
  }

  // 3. Keyword hits (0+ points, weighted x2, capped at 25)
  let keywordHits = 0;
  for (const kw of IMPACT_KEYWORDS) {
    // Title hits worth more than content hits
    if (titleLower.includes(kw)) {
      keywordHits += 2;
    } else if (contentLower.includes(kw)) {
      keywordHits += 1;
    }
  }
  score += Math.min(keywordHits, 25) * 2;

  // 4. Recency bonus (0-10 points)
  // Full bonus for 0-12 hours (brokers create morning content about yesterday PM events)
  // Decay linearly from 12h to 72h (3 days — content can reference recent events)
  if (item.published_at) {
    const ageMs = Date.now() - new Date(item.published_at).getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    if (ageHours <= 12) {
      score += 10;
    } else if (ageHours <= 72) {
      score += Math.round(10 * (1 - (ageHours - 12) / 60));
    }
  }

  return score;
}

/**
 * Rank news items by impact score and return the top N.
 */
export function rankByImpact(items: NewsItem[], limit: number): NewsItem[] {
  return items
    .map((item) => ({ item, score: calculateImpactScore(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => item);
}
