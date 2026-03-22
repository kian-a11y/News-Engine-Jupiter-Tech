"use client";

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
      <div
        className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot"
        style={{ animationDelay: "0.2s" }}
      />
      <div
        className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}
