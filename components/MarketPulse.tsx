"use client";

import { useState, useEffect, useRef } from "react";
import { DateRange } from "@/lib/types";

interface HeadlineItem {
  id: string;
  title: string;
  source_name: string;
  published_at: string | null;
  url: string | null;
  alternative_sources: { source_name: string; url: string }[];
}

interface MarketQuote {
  symbol: string;
  name: string;
  category: string;
  current_price: number;
  daily_change_pct: number | null;
  daily_high: number | null;
  daily_low: number | null;
  updated_at: string;
}

interface CalendarEvent {
  event_name: string;
  currency: string;
  impact: string;
  event_time: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
}

interface MarketPulseProps {
  dateRange: DateRange;
  isOpen: boolean;
  onToggle: () => void;
  onChatAbout?: (text: string) => void;
}

type PulseView = "news" | "quotes" | "calendar";
type QuoteTab = "fx" | "crypto" | "index" | "commodity";

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

function formatPrice(price: number, symbol: string): string {
  if (symbol.includes("=X")) {
    if (
      symbol.includes("JPY") ||
      symbol.includes("HUF") ||
      symbol.includes("KRW")
    )
      return price.toFixed(3);
    return price.toFixed(5);
  }
  if (price > 1000)
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price > 1) return price.toFixed(4);
  return price.toFixed(6);
}

const IMPACT_COLORS: Record<string, string> = {
  HIGH: "text-red-400 bg-red-400/10 border-red-400/30",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/30",
  LOW: "text-zinc-500 bg-zinc-500/10 border-zinc-500/30",
};

const CURRENCY_FLAGS: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", AUD: "🇦🇺",
  CAD: "🇨🇦", CHF: "🇨🇭", NZD: "🇳🇿", CNY: "🇨🇳", CNH: "🇨🇳",
  SEK: "🇸🇪", NOK: "🇳🇴", MXN: "🇲🇽", ZAR: "🇿🇦", SGD: "🇸🇬",
  HKD: "🇭🇰", KRW: "🇰🇷", INR: "🇮🇳", BRL: "🇧🇷", TRY: "🇹🇷",
  PLN: "🇵🇱", HUF: "🇭🇺", CZK: "🇨🇿", ILS: "🇮🇱", THB: "🇹🇭",
  TWD: "🇹🇼", PHP: "🇵🇭", IDR: "🇮🇩", MYR: "🇲🇾", RUB: "🇷🇺",
  ALL: "🌐",
};

const ANOMALY_THRESHOLDS: Record<string, number> = {
  fx: 5, crypto: 25, index: 10, commodity: 15, bond: 10, stock: 20,
};

type ImpactFilter = "HIGH" | "MEDIUM" | "LOW";

function CalendarView({ events, loading }: { events: CalendarEvent[]; loading: boolean }) {
  const [activeFilters, setActiveFilters] = useState<Set<ImpactFilter>>(
    new Set<ImpactFilter>(["HIGH", "MEDIUM"])
  );
  const todayRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const toggleFilter = (f: ImpactFilter) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) {
        if (next.size > 1) next.delete(f);
      } else {
        next.add(f);
      }
      return next;
    });
  };

  // Auto-scroll to today's section when events load
  useEffect(() => {
    if (!loading && events.length > 0 && todayRef.current && scrollContainerRef.current) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ block: "start" });
      }, 100);
    }
  }, [loading, events.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="font-mono text-xs text-zinc-600">
          No calendar events available. Run a scrape to load the economic calendar.
        </p>
      </div>
    );
  }

  // Filter by impact
  const filtered = events.filter((e) => activeFilters.has(e.impact as ImpactFilter));

  // Group by date key (YYYY-MM-DD) for proper sorting
  const grouped: { dateKey: string; label: string; events: CalendarEvent[] }[] = [];
  const groupMap: Record<string, number> = {};

  for (const ev of filtered) {
    const d = new Date(ev.event_time);
    const dateKey = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

    if (dateKey in groupMap) {
      grouped[groupMap[dateKey]].events.push(ev);
    } else {
      groupMap[dateKey] = grouped.length;
      grouped.push({ dateKey, label, events: [ev] });
    }
  }

  // Sort by date ascending (past first, future last)
  grouped.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

  const now = new Date();
  const todayKey = now.toISOString().split("T")[0];

  return (
    <div ref={scrollContainerRef}>
      {/* Impact filter bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/50">
        <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-wider mr-1">
          Impact:
        </span>
        {(["HIGH", "MEDIUM", "LOW"] as ImpactFilter[]).map((level) => (
          <button
            key={level}
            onClick={() => toggleFilter(level)}
            className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold border transition-all ${
              activeFilters.has(level)
                ? IMPACT_COLORS[level]
                : "text-zinc-700 bg-transparent border-zinc-800 opacity-40"
            }`}
          >
            {level}
          </button>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="px-3 py-1 bg-accent/5 border-b border-border/20">
        <p className="font-mono text-[8px] text-zinc-600 text-center">
          ↑ PAST 7 DAYS &nbsp;·&nbsp; TODAY &nbsp;·&nbsp; NEXT 7 DAYS ↓
        </p>
      </div>

      {/* Day groups */}
      {grouped.map(({ dateKey, label, events: dayEvents }) => {
        const isToday = dateKey === todayKey;
        const isPastDay = dateKey < todayKey;

        return (
          <div key={dateKey} ref={isToday ? todayRef : undefined}>
            {/* Day header */}
            <div
              className={`sticky top-0 z-10 px-3 py-1.5 border-b border-border/30 flex items-center gap-2 ${
                isToday
                  ? "bg-accent/10 border-b-accent/30"
                  : "bg-[#111116]"
              }`}
            >
              <span
                className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${
                  isToday ? "text-accent" : isPastDay ? "text-zinc-600" : "text-zinc-400"
                }`}
              >
                {label}
              </span>
              {isToday && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-accent text-background">
                  TODAY
                </span>
              )}
              <span className="font-mono text-[9px] text-zinc-600 ml-auto">
                {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Events */}
            {dayEvents.map((ev, idx) => {
              const eventTime = new Date(ev.event_time);
              const isPast = eventTime < now;
              const flag = CURRENCY_FLAGS[ev.currency] || CURRENCY_FLAGS["ALL"] || "🌐";
              const impactDot =
                ev.impact === "HIGH"
                  ? "bg-red-500"
                  : ev.impact === "MEDIUM"
                    ? "bg-amber-500"
                    : "bg-zinc-600";

              return (
                <div
                  key={`${ev.event_name}-${ev.event_time}-${idx}`}
                  className={`px-3 py-2 border-b border-border/10 hover:bg-accent/5 transition-colors ${
                    isPast ? "opacity-40" : ""
                  }`}
                >
                  {/* Top row: time + currency + impact */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-[9px] text-zinc-500 w-[52px] flex-shrink-0 tabular-nums">
                      {eventTime.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      })}{" "}
                      UTC
                    </span>
                    <span className="text-[11px] leading-none">{flag}</span>
                    <span className="font-mono text-[9px] font-semibold text-zinc-400">
                      {ev.currency}
                    </span>
                    <div className={`w-1.5 h-1.5 rounded-full ${impactDot} flex-shrink-0`} />
                  </div>

                  {/* Event name */}
                  <p className="font-mono text-[11px] text-zinc-300 leading-snug pl-[52px]">
                    {ev.event_name}
                  </p>

                  {/* Forecast / Previous / Actual row */}
                  {(ev.forecast || ev.previous || ev.actual) && (
                    <div className="flex items-center gap-3 mt-1 pl-[52px]">
                      {ev.forecast && (
                        <span className="font-mono text-[9px]">
                          <span className="text-zinc-600">F </span>
                          <span className="text-zinc-400">{ev.forecast}</span>
                        </span>
                      )}
                      {ev.previous && (
                        <span className="font-mono text-[9px]">
                          <span className="text-zinc-600">P </span>
                          <span className="text-zinc-400">{ev.previous}</span>
                        </span>
                      )}
                      {ev.actual && (
                        <span className="font-mono text-[9px]">
                          <span className="text-zinc-600">A </span>
                          <span className="text-accent font-semibold">{ev.actual}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="px-4 py-8 text-center">
          <p className="font-mono text-xs text-zinc-600">
            No events match the selected filters.
          </p>
        </div>
      )}
    </div>
  );
}

export default function MarketPulse({
  dateRange,
  isOpen,
  onToggle,
  onChatAbout,
}: MarketPulseProps) {
  const [headlines, setHeadlines] = useState<HeadlineItem[]>([]);
  const [quotes, setQuotes] = useState<MarketQuote[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [view, setView] = useState<PulseView>("news");
  const [quoteTab, setQuoteTab] = useState<QuoteTab>("fx");

  // Fetch headlines (loads immediately when panel opens)
  useEffect(() => {
    if (!isOpen) return;
    setLoadingHeadlines(true);
    fetch(
      `/api/headlines?from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}`
    )
      .then((r) => r.json())
      .then((data) => setHeadlines(data.headlines || []))
      .catch(() => setHeadlines([]))
      .finally(() => setLoadingHeadlines(false));
  }, [isOpen, dateRange.from, dateRange.to]);

  // Fetch quotes only when quotes tab is active
  useEffect(() => {
    if (!isOpen || view !== "quotes") return;
    setLoadingQuotes(true);
    fetch(`/api/market-data?category=${quoteTab}&limit=50`)
      .then((r) => r.json())
      .then((data) => setQuotes(data.data || []))
      .catch(() => setQuotes([]))
      .finally(() => setLoadingQuotes(false));
  }, [isOpen, view, quoteTab]);

  // Fetch calendar only when calendar tab is active
  useEffect(() => {
    if (!isOpen || view !== "calendar") return;
    setLoadingCalendar(true);
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingCalendar(false));
  }, [isOpen, view]);

  const QUOTE_TABS: { label: string; value: QuoteTab }[] = [
    { label: "FX", value: "fx" },
    { label: "Crypto", value: "crypto" },
    { label: "Indices", value: "index" },
    { label: "Commod.", value: "commodity" },
  ];

  const VIEW_TABS: { label: string; value: PulseView }[] = [
    { label: "News", value: "news" },
    { label: "Quotes", value: "quotes" },
    { label: "Calendar", value: "calendar" },
  ];

  return (
    <>
      {/* Mobile FAB */}
      <button
        onClick={onToggle}
        className={`fixed bottom-24 right-4 z-50 w-12 h-12 lg:hidden flex items-center justify-center rounded-full shadow-lg shadow-accent/20 transition-all active:scale-95 ${
          isOpen ? "bg-zinc-800 text-zinc-400" : "bg-accent text-background"
        }`}
        title="Market Pulse"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          )}
        </svg>
      </button>

      {/* Toggle button — desktop only */}
      <button
        onClick={onToggle}
        className="fixed top-[58px] right-3 z-50 w-8 h-8 hidden lg:flex items-center justify-center rounded-md border border-border bg-surface hover:border-accent/40 hover:text-accent text-zinc-500 transition-all duration-200"
        title={isOpen ? "Close Market Pulse" : "Market Pulse"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          )}
        </svg>
      </button>

      {/* Panel */}
      <div
        className={`fixed top-[52px] right-0 h-[calc(100vh-52px)] w-80 bg-surface border-l border-border z-40 transition-transform duration-300 ease-in-out flex-col hidden lg:flex ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header with view toggle */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
              Market Pulse
            </span>
          </div>
          <div className="flex rounded-md overflow-hidden border border-border">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setView(tab.value)}
                className={`px-2 py-1 text-[10px] font-mono transition-all ${
                  view === tab.value
                    ? "bg-accent text-background font-semibold"
                    : "text-zinc-500 hover:text-accent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ─── NEWS VIEW ─── */}
          {view === "news" && (
            <>
              {loadingHeadlines ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : headlines.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-mono text-xs text-zinc-600">
                    No headlines for this period
                  </p>
                </div>
              ) : (
                <div>
                  {headlines.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 px-4 py-3 border-b border-border/30 border-l-2 border-l-accent/30 hover:bg-accent/5 hover:border-l-accent transition-all duration-150 group"
                    >
                      <a
                        href={item.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0"
                      >
                        <p className="font-sans text-xs text-zinc-300 leading-relaxed line-clamp-2 group-hover:text-accent transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="font-mono text-[10px] text-accent/70">
                            {item.source_name}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-700">
                            {timeAgo(item.published_at)}
                          </span>
                          {item.alternative_sources?.length > 0 && (
                            <span className="font-mono text-[10px] text-zinc-600 bg-surface-light px-1.5 py-0.5 rounded">
                              +{item.alternative_sources.length} source
                              {item.alternative_sources.length > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </a>
                      {onChatAbout && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onChatAbout("Write content about this story: " + item.title);
                          }}
                          className="flex-shrink-0 mt-1 p-1.5 rounded-md text-zinc-700 hover:text-accent hover:bg-accent/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Send to chat"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ─── QUOTES VIEW ─── */}
          {view === "quotes" && (
            <>
              {/* Quote category tabs */}
              <div className="flex border-b border-border/50">
                {QUOTE_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setQuoteTab(tab.value)}
                    className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-all ${
                      quoteTab === tab.value
                        ? "text-accent border-b-2 border-accent font-semibold"
                        : "text-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Quotes list */}
              {loadingQuotes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                </div>
              ) : quotes.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="font-mono text-xs text-zinc-600">
                    No market data available. Run a scrape to load quotes.
                  </p>
                </div>
              ) : (
                <div>
                  {quotes.map((q) => {
                    const isPositive = (q.daily_change_pct || 0) >= 0;
                    const isAnomalous = Math.abs(q.daily_change_pct || 0) > (ANOMALY_THRESHOLDS[q.category] || 15);
                    return (
                      <div
                        key={q.symbol}
                        className="flex items-center justify-between px-4 py-2 border-b border-border/20 hover:bg-accent/5 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[11px] text-zinc-300 truncate">
                            {q.name}
                          </p>
                          <p className="font-mono text-[9px] text-zinc-600">
                            {q.symbol.replace("=X", "").replace("-USD", "")}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-mono text-[11px] text-zinc-200 tabular-nums">
                            {formatPrice(q.current_price, q.symbol)}
                          </p>
                          <p
                            className={`font-mono text-[10px] tabular-nums ${
                              isAnomalous
                                ? "text-zinc-600"
                                : isPositive
                                  ? "text-green-500"
                                  : "text-red-500"
                            }`}
                            title={isAnomalous ? "Data may be inaccurate — verify with platform" : undefined}
                          >
                            {isAnomalous ? "⚠️ " : ""}{isPositive ? "+" : ""}
                            {(q.daily_change_pct || 0).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ─── CALENDAR VIEW ─── */}
          {view === "calendar" && (
            <CalendarView
              events={events}
              loading={loadingCalendar}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border">
          <p className="font-mono text-[10px] text-zinc-700 text-center">
            {view === "quotes"
              ? "Live data via Yahoo Finance. Delayed up to 15 min."
              : view === "calendar"
                ? "Economic calendar. Times shown in UTC."
                : "Sources provided for reference. All analysis is AI-generated."}
          </p>
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div onClick={onToggle} className="absolute inset-0 bg-black/60" />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 h-[70vh] bg-surface border-t border-border rounded-t-2xl flex flex-col animate-slide-up overflow-hidden">
            {/* Drag handle */}
            <div className="flex justify-center py-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
                  Market Pulse
                </span>
              </div>
              <div className="flex rounded-md overflow-hidden border border-border">
                {VIEW_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setView(tab.value)}
                    className={`px-2.5 py-1 text-[10px] font-mono transition-all ${
                      view === tab.value
                        ? "bg-accent text-background font-semibold"
                        : "text-zinc-500 hover:text-accent"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Content - reuse the same content sections */}
            <div className="flex-1 overflow-y-auto">
              {view === "news" && (
                <>
                  {loadingHeadlines ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                  ) : headlines.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="font-mono text-xs text-zinc-600">No headlines for this period</p>
                    </div>
                  ) : (
                    <div>
                      {headlines.map((item) => (
                        <a
                          key={item.id}
                          href={item.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-4 py-3 border-b border-border/30 border-l-2 border-l-accent/30 hover:bg-accent/5 hover:border-l-accent transition-all duration-150"
                        >
                          <p className="font-sans text-xs text-zinc-300 leading-relaxed line-clamp-2">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="font-mono text-[10px] text-accent/70">{item.source_name}</span>
                            <span className="font-mono text-[10px] text-zinc-700">{timeAgo(item.published_at)}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
              {view === "quotes" && (
                <>
                  <div className="flex border-b border-border/50">
                    {QUOTE_TABS.map((tab) => (
                      <button
                        key={tab.value}
                        onClick={() => setQuoteTab(tab.value)}
                        className={`flex-1 py-2 text-[10px] font-mono uppercase tracking-wider transition-all ${
                          quoteTab === tab.value
                            ? "text-accent border-b-2 border-accent font-semibold"
                            : "text-zinc-600 hover:text-zinc-400"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {loadingQuotes ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div>
                      {quotes.map((q) => {
                        const isPositive = (q.daily_change_pct || 0) >= 0;
                        return (
                          <div key={q.symbol} className="flex items-center justify-between px-4 py-2 border-b border-border/20">
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-[11px] text-zinc-300 truncate">{q.name}</p>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className="font-mono text-[11px] text-zinc-200 tabular-nums">
                                {formatPrice(q.current_price, q.symbol)}
                              </p>
                              <p className={`font-mono text-[10px] tabular-nums ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                {isPositive ? "+" : ""}{(q.daily_change_pct || 0).toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              {view === "calendar" && (
                <CalendarView events={events} loading={loadingCalendar} />
              )}
            </div>
            {/* Footer */}
            <div className="px-4 py-2 border-t border-border flex-shrink-0">
              <p className="font-mono text-[10px] text-zinc-700 text-center">
                {view === "quotes" ? "Live data via Yahoo Finance." : view === "calendar" ? "Times shown in UTC." : "AI-generated analysis."}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
