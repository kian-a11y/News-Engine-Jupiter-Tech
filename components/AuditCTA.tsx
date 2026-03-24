"use client";

const BOOKING_URL = "https://calendly.com/kian-jupitertech/cfd-ai-audit";

/**
 * Subtle post-output CTA shown after Claude delivers value.
 * Appears below the copy button on assistant messages.
 */
export function PostOutputCTA() {
  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <div className="flex items-start gap-3 px-1">
        <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f0b429"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
          This took you 2 minutes instead of 2 hours. Now imagine every workflow across your brokerage running like this — CRM, client portal, compliance, content, all connected.{" "}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-medium"
          >
            See the full operating system →
          </a>
        </p>
      </div>
    </div>
  );
}

/**
 * Copy hook tooltip — shown briefly after copying content.
 */
export function CopyHookTooltip() {
  return (
    <div className="animate-fade-in absolute bottom-full right-0 mb-2 w-64 bg-surface border border-accent/20 rounded-lg px-3 py-2 shadow-lg shadow-black/20">
      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
        Content is just the start.{" "}
        <a
          href={BOOKING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline font-medium"
        >
          See the full broker OS →
        </a>
      </p>
      <div className="absolute bottom-[-5px] right-4 w-2.5 h-2.5 bg-surface border-b border-r border-accent/20 rotate-45" />
    </div>
  );
}

/**
 * Usage milestone banner — shown once after N outputs in a session.
 */
export function UsageMilestoneBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="animate-fade-in mx-4 sm:mx-6 mb-4 bg-accent/5 border border-accent/20 rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center flex-shrink-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f0b429"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-300 font-sans leading-relaxed">
          This is one workflow. Jupiter Tech&apos;s broker OS connects 100+ more — CRM, client portal, compliance, risk, and beyond.{" "}
          <a
            href={BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline font-medium"
          >
            Book a free demo →
          </a>
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
