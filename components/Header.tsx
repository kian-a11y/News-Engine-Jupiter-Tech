"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [freshnessLabel, setFreshnessLabel] = useState<string | null>(null);
  const [freshnessColor, setFreshnessColor] = useState<string>("text-zinc-600");
  const [freshnessDot, setFreshnessDot] = useState<string>("bg-zinc-600");
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email || null);
    });
  }, []);

  useEffect(() => {
    fetch("/api/freshness")
      .then((r) => r.json())
      .then((data: { newsScrapedAt: string | null; marketUpdatedAt: string | null }) => {
        const timestamps = [data.newsScrapedAt, data.marketUpdatedAt].filter(Boolean) as string[];
        if (timestamps.length === 0) return;
        const mostRecent = new Date(
          Math.max(...timestamps.map((t) => new Date(t).getTime()))
        );
        const mins = Math.floor((Date.now() - mostRecent.getTime()) / 60000);
        if (mins < 30) {
          setFreshnessLabel(`${mins}m ago`);
          setFreshnessColor("text-green-500/70");
          setFreshnessDot("bg-green-500");
        } else if (mins < 120) {
          const h = Math.floor(mins / 60);
          setFreshnessLabel(`${h}h ago`);
          setFreshnessColor("text-amber-500/70");
          setFreshnessDot("bg-amber-500");
        } else {
          const h = Math.floor(mins / 60);
          setFreshnessLabel(`${h}h old`);
          setFreshnessColor("text-red-400/70");
          setFreshnessDot("bg-red-400");
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <header className="relative z-10 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-border bg-surface/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.png" alt="Jupiter Tech" width={28} height={28} className="w-7 h-7 rounded-lg object-cover" />
          <span className="text-foreground font-sans font-semibold text-base tracking-tight">
            Jupiter Tech
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <a
          href="https://calendly.com/kian-jupitertech/cfd-ai-audit"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-[11px] font-sans font-medium text-accent border border-accent/30 rounded-full hover:bg-accent/10 hover:border-accent/50 transition-all duration-200"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f0b429" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Book a Free AI Strategy Session
        </a>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-mono text-sm text-zinc-400 tracking-wide">
            FX News Engine
          </span>
          {freshnessLabel && (
            <span className={`flex items-center gap-1 font-mono text-[10px] ${freshnessColor}`}>
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${freshnessDot}`} />
              {freshnessLabel}
            </span>
          )}
        </div>
        {email && (
          <>
            <div className="hidden sm:block w-px h-5 bg-border" />
            <span className="hidden md:block font-mono text-xs text-zinc-500 truncate max-w-[180px]">
              {email}
            </span>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 text-xs font-mono text-zinc-500 hover:text-accent border border-border rounded-md hover:border-accent/40 transition-all duration-200"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
