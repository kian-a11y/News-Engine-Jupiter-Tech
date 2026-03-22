export interface NewsItem {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  source_name: string;
  published_at: string | null;
  scraped_at: string;
  alternative_sources?: { source_name: string; url: string }[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ScrapeResult {
  success: number;
  failed: string[];
  total: number;
}

export type DateRangePreset = "today" | "yesterday" | "this_week" | "custom";

export interface DateRange {
  preset: DateRangePreset;
  from: string;
  to: string;
}
