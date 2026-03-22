"use client";

const QUICK_ACTIONS = [
  {
    label: "Morning Brief",
    prompt:
      "Create a morning market brief for our clients. Overview, top 5 stories with citations, instruments to watch table, and outlook. 800-1200 words, institutional quality.",
  },
  {
    label: "Social Posts",
    prompt:
      "Write 5 social posts for our broker channels. Mix: 1 breaking alert, 1 educational, 1 data-driven, 1 opinion, 1 engagement question. Specify platform (Twitter/X or LinkedIn), include hashtags.",
  },
  {
    label: "Risk Alerts",
    prompt:
      "Generate internal risk alerts for our dealing desk. Format: SEVERITY | Instrument | Event | Impact Window | Action. At least 5 alerts ranked by severity.",
  },
  {
    label: "Lead Gen Article",
    prompt:
      "Create a lead-gen article (600-900 words) from today's most exciting story. Compelling headline, urgency hook, 3 sections with market data, trading angle, and CTA close. Target: retail traders.",
  },
  {
    label: "Email Campaign",
    prompt:
      "Write a complete trader email: subject line (<50 chars, urgency), preview text (<90 chars), body with 3 stories, featured instrument analysis, and CTA button text.",
  },
  {
    label: "Push Notifications",
    prompt:
      "Draft 8 push notifications (<100 chars each). Group: 3 breaking alerts, 3 opportunity signals, 2 educational hooks. Each must include a specific number or instrument.",
  },
  {
    label: "Sales Talking Points",
    prompt:
      "Create 6 sales talking points for account managers to use in calls today. Each: market narrative, what to say, how to close. Include one for dormant/inactive clients.",
  },
  {
    label: "Crisis Response",
    prompt:
      "Create a crisis response package for the biggest story right now. Deliver: 1 push notification (NOW), 1 social post (NOW), 1 email blast (within 1 hour), 1 detailed analysis piece (within 2 hours). All sourced, all ready to publish.",
  },
  {
    label: "Pair Deep Dive",
    prompt:
      "Give me a complete content package for the most active pair today: social post, email section, analyst note, client alert, and 3 key levels from live data. Everything ready to publish.",
  },
  {
    label: "Weekend Prep",
    prompt:
      "Create a Friday wrap-up and Monday prep package. Include: week summary (top 3 themes), performance scorecard of major movers, next week's calendar highlights, and 3 content angles for Monday morning.",
  },
  {
    label: "Retention Email",
    prompt:
      "Create a re-engagement email for inactive traders. Show what they're missing from today's markets. Subject line with urgency, 3 missed opportunities, FOMO paragraph, and re-activation CTA.",
  },
  {
    label: "Volatility Report",
    prompt:
      "Create a volatility assessment table: Instrument | Volatility Level | Catalyst | Direction Bias | Key Level. Only include instruments with sourced data. Add a volatility outlook paragraph.",
  },
  {
    label: "Management Summary",
    prompt:
      "Create a 300-word executive summary. Headline takeaway, 3 key themes, business impact (trader activity, volumes, risk), and 2-3 action items. No fluff.",
  },
  {
    label: "Education Content",
    prompt:
      "Create an educational article (500-700 words) explaining today's biggest event for retail traders. Structure: What Happened, Why It Matters, How It Affects Trading, What to Watch Next.",
  },
  {
    label: "Analyst Notes",
    prompt:
      "Create analyst bullet-point notes for the top 6 stories: headline, citation, key data points, fundamental driver, one-line commentary angle. End with 'Theme of the Day'.",
  },
];

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  disabled: boolean;
}

export default function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="relative z-10 border-t border-border bg-surface/60 backdrop-blur-sm px-4 py-2.5 space-y-1.5">
      {/* Primary row */}
      <div className="flex gap-2 overflow-x-auto quick-actions-scroll pb-0.5">
        {QUICK_ACTIONS.slice(0, 1).map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            className="flex-shrink-0 px-4 py-1.5 text-xs font-mono bg-accent text-background font-semibold rounded-full hover:bg-accent-dim active:scale-95 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {action.label}
          </button>
        ))}
        {QUICK_ACTIONS.slice(1, 6).map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            className="flex-shrink-0 px-3.5 py-1.5 text-xs font-mono text-accent/80 border border-accent/30 rounded-full hover:text-accent hover:border-accent hover:bg-accent/10 active:bg-accent active:text-background transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {action.label}
          </button>
        ))}
      </div>
      {/* Secondary row */}
      <div className="flex gap-2 overflow-x-auto quick-actions-scroll pb-0.5">
        {QUICK_ACTIONS.slice(6).map((action) => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            className="flex-shrink-0 px-3 py-1 text-[11px] font-mono text-zinc-500 border border-border/60 rounded-full hover:text-accent hover:border-accent/30 hover:bg-accent/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
