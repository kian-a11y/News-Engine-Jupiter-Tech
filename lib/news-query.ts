import { SupabaseClient } from "@supabase/supabase-js";
import { NewsItem } from "./types";

/**
 * Fetch news items for a date range with even sampling across days.
 * Single-day ranges use a simple query. Multi-day ranges distribute
 * items evenly so no single day dominates the context.
 */
export async function fetchNewsForRange(
  supabase: SupabaseClient,
  from: string,
  to: string,
  limit: number
): Promise<NewsItem[]> {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  // Ensure toDate includes the full day
  const toEnd = new Date(toDate);
  toEnd.setHours(23, 59, 59, 999);

  const dayCount = Math.max(
    1,
    Math.ceil((toEnd.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000))
  );

  // Single day — simple query
  if (dayCount <= 1) {
    const { data } = await supabase
      .from("news_items")
      .select("*")
      .gte("published_at", fromDate.toISOString())
      .lte("published_at", toEnd.toISOString())
      .order("published_at", { ascending: false })
      .limit(limit);

    if (data && data.length > 0) return data;

    // Progressive fallback: expand backwards 1 day at a time, up to 3 attempts
    for (let attempt = 1; attempt <= 3; attempt++) {
      const expandedFrom = new Date(fromDate);
      expandedFrom.setDate(expandedFrom.getDate() - attempt);
      expandedFrom.setHours(0, 0, 0, 0);

      const { data: expanded } = await supabase
        .from("news_items")
        .select("*")
        .gte("published_at", expandedFrom.toISOString())
        .lte("published_at", toEnd.toISOString())
        .order("published_at", { ascending: false })
        .limit(limit);

      if (expanded && expanded.length > 0) return expanded;
    }

    // Final fallback: last 7 days (never unlimited)
    const weekAgo = new Date(fromDate);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: fallback } = await supabase
      .from("news_items")
      .select("*")
      .gte("published_at", weekAgo.toISOString())
      .order("published_at", { ascending: false })
      .limit(limit);

    return fallback || [];
  }

  // Multi-day — even sampling across each day
  const perDay = Math.ceil(limit / dayCount);
  const allItems: NewsItem[] = [];

  for (let d = 0; d < dayCount; d++) {
    const dayStart = new Date(fromDate);
    dayStart.setDate(dayStart.getDate() + d);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Don't go past the requested end date
    if (dayStart > toEnd) break;

    const { data } = await supabase
      .from("news_items")
      .select("*")
      .gte("published_at", dayStart.toISOString())
      .lte("published_at", dayEnd > toEnd ? toEnd.toISOString() : dayEnd.toISOString())
      .order("published_at", { ascending: false })
      .limit(perDay);

    if (data) allItems.push(...data);
  }

  // If we got more than the limit, trim evenly
  if (allItems.length > limit) {
    return allItems.slice(0, limit);
  }

  // Fallback if range returned nothing — expand backwards progressively
  if (allItems.length === 0) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const expandedFrom = new Date(fromDate);
      expandedFrom.setDate(expandedFrom.getDate() - attempt);
      expandedFrom.setHours(0, 0, 0, 0);

      const { data: expanded } = await supabase
        .from("news_items")
        .select("*")
        .gte("published_at", expandedFrom.toISOString())
        .order("published_at", { ascending: false })
        .limit(limit);

      if (expanded && expanded.length > 0) return expanded;
    }

    // Final fallback: last 7 days
    const weekAgo = new Date(fromDate);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: fallback } = await supabase
      .from("news_items")
      .select("*")
      .gte("published_at", weekAgo.toISOString())
      .order("published_at", { ascending: false })
      .limit(limit);

    return fallback || [];
  }

  return allItems;
}
