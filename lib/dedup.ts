const STOP_WORDS = new Set([
  "the", "a", "an", "in", "for", "to", "of", "and", "is", "at", "on", "by",
  "it", "its", "as", "be", "are", "was", "were", "has", "have", "had", "with",
  "from", "or", "but", "not", "this", "that", "will", "can", "may", "could",
  "would", "should", "after", "before", "over", "into", "about", "than",
  "says", "said", "new", "also", "more", "most", "just", "been",
]);

const SIMILARITY_THRESHOLD = 0.6;

// Source tiers for quality-based swap decisions during dedup
// Higher = prefer keeping this source as primary over a lower-tier source
const SOURCE_QUALITY: Record<string, number> = {
  "FXStreet": 5, "ForexLive": 5, "BabyPips": 5,
  "Federal Reserve": 4, "ECB": 4, "Bank of England": 4,
  "Investing.com": 4, "FX News (Google)": 3,
  "Central Bankers": 3, "World Leaders & Geopolitics": 3,
  "US Treasury & Fiscal": 3, "OPEC & Energy": 3,
  "Market-Moving CEOs": 3, "CNBC": 3, "Yahoo Finance": 2,
  "BBC Business": 2, "IMF & Global Economy": 2,
};

interface ScrapedItem {
  title: string;
  content: string;
  url: string | null;
  source_name: string;
  published_at: string;
}

export interface DeduplicatedItem extends ScrapedItem {
  alternative_sources: { source_name: string; url: string }[];
}

function normalize(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .join(" ");
}

function trigrams(s: string): Set<string> {
  const result = new Set<string>();
  for (let i = 0; i <= s.length - 3; i++) {
    result.add(s.slice(i, i + 3));
  }
  return result;
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach((t) => {
    if (b.has(t)) intersection++;
  });
  return (2 * intersection) / (a.size + b.size);
}

export function deduplicateItems(items: ScrapedItem[]): DeduplicatedItem[] {
  const accepted: DeduplicatedItem[] = [];
  const acceptedTrigrams: Set<string>[] = [];

  for (const item of items) {
    const norm = normalize(item.title);
    if (norm.length < 6) {
      // Title too short to meaningfully deduplicate
      accepted.push({ ...item, alternative_sources: [] });
      acceptedTrigrams.push(trigrams(norm));
      continue;
    }

    const itemTri = trigrams(norm);
    let isDuplicate = false;

    for (let i = 0; i < accepted.length; i++) {
      const sim = similarity(itemTri, acceptedTrigrams[i]);
      if (sim >= SIMILARITY_THRESHOLD) {
        // Duplicate found — keep the one with more content
        const existingLen = accepted[i].content?.length || 0;
        const newLen = item.content?.length || 0;

        if (item.url) {
          accepted[i].alternative_sources.push({
            source_name: item.source_name,
            url: item.url,
          });
        }

        // Swap decision: prefer higher-tier source when content lengths are similar (within 20%)
        const lengthRatio = existingLen > 0 ? newLen / existingLen : newLen > 0 ? 2 : 1;
        const existingTier = SOURCE_QUALITY[accepted[i].source_name] || 2;
        const newTier = SOURCE_QUALITY[item.source_name] || 2;
        const shouldSwap = lengthRatio > 1.2
          ? true   // New item has >20% more content — swap for length
          : lengthRatio >= 0.8 && newTier > existingTier; // Similar length — prefer higher tier

        if (shouldSwap) {
          // Swap: new item is better (more content or higher quality source)
          const oldUrl = accepted[i].url;
          const oldSource = accepted[i].source_name;
          if (oldUrl) {
            accepted[i].alternative_sources.push({
              source_name: oldSource,
              url: oldUrl,
            });
          }
          // Remove the entry we just added for the new item
          const lastAlt = accepted[i].alternative_sources;
          const newItemIdx = lastAlt.findIndex((a) => a.url === item.url);
          if (newItemIdx !== -1) lastAlt.splice(newItemIdx, 1);

          accepted[i].title = item.title;
          accepted[i].content = item.content;
          accepted[i].url = item.url;
          accepted[i].source_name = item.source_name;
          accepted[i].published_at = item.published_at;
          acceptedTrigrams[i] = itemTri;
        }

        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      accepted.push({ ...item, alternative_sources: [] });
      acceptedTrigrams.push(itemTri);
    }
  }

  return accepted;
}
