"use client";

import { useState } from "react";
import { DateRange, DateRangePreset } from "@/lib/types";

interface DateRangeFilterProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  newsCount?: number;
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function weekAgoISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split("T")[0];
}

const PRESETS: { label: string; value: DateRangePreset }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "Custom", value: "custom" },
];

export default function DateRangeFilter({
  dateRange,
  onChange,
  newsCount,
}: DateRangeFilterProps) {
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = (preset: DateRangePreset) => {
    setShowCustom(preset === "custom");

    switch (preset) {
      case "today":
        onChange({ preset, from: todayISO(), to: todayISO() });
        break;
      case "yesterday":
        onChange({ preset, from: yesterdayISO(), to: yesterdayISO() });
        break;
      case "this_week":
        onChange({ preset, from: weekAgoISO(), to: todayISO() });
        break;
      case "custom":
        // Keep current dates, just open the picker
        onChange({ ...dateRange, preset });
        break;
    }
  };

  return (
    <div className="px-4 sm:px-6 py-2 border-b border-border/50 bg-surface/40">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-[10px] text-zinc-600 uppercase tracking-wider mr-1">
          News Period
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`px-3 py-1 text-xs font-mono rounded-full border transition-all duration-200 ${
              dateRange.preset === p.value
                ? "bg-accent text-background border-accent font-semibold"
                : "border-accent/30 text-accent/70 hover:text-accent hover:border-accent hover:bg-accent/10"
            }`}
          >
            {p.label}
          </button>
        ))}

        {showCustom && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={dateRange.from}
              max={todayISO()}
              onChange={(e) =>
                onChange({ ...dateRange, from: e.target.value })
              }
              className="bg-background border border-border rounded-md px-2 py-1 text-xs font-mono text-zinc-300 outline-none focus:border-accent/50"
            />
            <span className="text-zinc-600 text-xs">to</span>
            <input
              type="date"
              value={dateRange.to}
              max={todayISO()}
              min={dateRange.from}
              onChange={(e) =>
                onChange({ ...dateRange, to: e.target.value })
              }
              className="bg-background border border-border rounded-md px-2 py-1 text-xs font-mono text-zinc-300 outline-none focus:border-accent/50"
            />
          </div>
        )}
        {newsCount != null && newsCount > 0 && (
          <span className="font-mono text-[10px] text-zinc-600 ml-auto tabular-nums">
            {newsCount} articles
          </span>
        )}
      </div>
    </div>
  );
}
