import { getServiceClient } from "./supabase";

/**
 * Economic Calendar fetcher.
 * Uses the free Fair Economy / Forex Factory JSON endpoint.
 * Returns structured calendar data with impact levels, forecasts, and actuals.
 */

interface FFEvent {
  title: string;
  country: string;
  date: string;
  impact: string; // "High", "Medium", "Low", "Holiday"
  forecast: string;
  previous: string;
}

/**
 * Fetch this week's economic calendar from the free Fair Economy endpoint.
 * This mirrors Forex Factory data in clean JSON format.
 */
async function fetchForexFactoryCalendar(): Promise<FFEvent[]> {
  try {
    const res = await fetch(
      "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FXNewsEngine/1.0)",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) {
      console.error(`[Calendar] Fair Economy failed: ${res.status}`);
      return [];
    }

    const data: FFEvent[] = await res.json();
    console.log(`[Calendar] Fair Economy: ${data.length} events fetched`);
    return data;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Calendar] Fair Economy error:`, msg);
    return [];
  }
}

/**
 * Map Fair Economy impact levels to our format.
 */
function normalizeImpact(impact: string): "HIGH" | "MEDIUM" | "LOW" | "HOLIDAY" {
  switch (impact.toLowerCase()) {
    case "high": return "HIGH";
    case "medium": return "MEDIUM";
    case "low": return "LOW";
    case "holiday": return "HOLIDAY";
    default: return "LOW";
  }
}

/**
 * Fetch and store economic calendar events.
 */
export async function fetchEconomicCalendar(): Promise<{
  success: number;
  failed: number;
}> {
  const supabase = getServiceClient();

  const events = await fetchForexFactoryCalendar();

  if (events.length === 0) {
    console.log(`[Calendar] No events fetched`);
    return { success: 0, failed: 0 };
  }

  // Transform to DB rows
  const rows = events.map((e) => ({
    event_name: e.title,
    currency: e.country,
    impact: normalizeImpact(e.impact),
    event_time: new Date(e.date).toISOString(),
    forecast: e.forecast || null,
    previous: e.previous || null,
    actual: null as string | null, // FF free endpoint doesn't include actuals
    scraped_at: new Date().toISOString(),
  }));

  // Clear old events and insert fresh (avoids stale data)
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  await supabase
    .from("economic_events")
    .delete()
    .lt("event_time", weekAgo);

  // Upsert in batches
  let success = 0;
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from("economic_events")
      .upsert(batch, { onConflict: "event_name,event_time", ignoreDuplicates: false });

    if (error) {
      console.error(`[Calendar] DB upsert error:`, error.message);
    } else {
      success += batch.length;
    }
  }

  console.log(`[Calendar] Stored ${success}/${rows.length} events`);
  return { success, failed: rows.length - success };
}

/**
 * Get upcoming economic events from DB.
 * Returns events from 24h ago to 48h ahead, sorted by time.
 */
export async function getUpcomingEvents() {
  const supabase = getServiceClient();
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAhead = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from("economic_events")
    .select("*")
    .gte("event_time", dayAgo)
    .lte("event_time", twoDaysAhead)
    .order("event_time", { ascending: true });

  return data || [];
}

/**
 * Get events for the calendar view: past 7 days through next 7 days.
 * Sorted ascending so past → today → future.
 */
export async function getWeekEvents() {
  const supabase = getServiceClient();

  const now = new Date();

  const past = new Date(now);
  past.setDate(now.getDate() - 7);
  past.setHours(0, 0, 0, 0);

  const future = new Date(now);
  future.setDate(now.getDate() + 7);
  future.setHours(23, 59, 59, 999);

  const { data } = await supabase
    .from("economic_events")
    .select("*")
    .gte("event_time", past.toISOString())
    .lte("event_time", future.toISOString())
    .order("event_time", { ascending: true });

  return data || [];
}
