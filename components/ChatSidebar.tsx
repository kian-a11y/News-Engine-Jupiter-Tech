"use client";

import { useState, useEffect } from "react";

interface ChatSession {
  id: string;
  title: string;
  lastActive: string;
  messageCount: number;
}

interface ChatSidebarProps {
  currentSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
  userEmail: string | null;
}

function timeAgo(dateStr: string): string {
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

export default function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  isOpen,
  onToggle,
  userEmail,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userEmail) return;
    setLoading(true);
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [isOpen, userEmail]);

  return (
    <>
      {/* Toggle button - always visible */}
      <button
        onClick={onToggle}
        className="fixed top-[58px] left-3 z-50 w-8 h-8 flex items-center justify-center rounded-md border border-border bg-surface hover:border-accent/40 hover:text-accent text-zinc-500 transition-all duration-200"
        title={isOpen ? "Close sidebar" : "Chat history"}
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
            <>
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </>
          )}
        </svg>
      </button>

      {/* Sidebar panel */}
      <div
        className={`fixed top-[52px] left-0 h-[calc(100vh-52px)] w-72 bg-surface border-r border-border z-40 transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-mono text-xs text-zinc-400 uppercase tracking-wider">
            Chat History
          </span>
          <button
            onClick={onNewChat}
            className="px-2.5 py-1 text-xs font-mono text-accent border border-accent/30 rounded-md hover:bg-accent/10 transition-all duration-200"
          >
            + New
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="font-mono text-xs text-zinc-600">No previous chats</p>
            </div>
          ) : (
            <div className="py-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-accent/5 transition-all duration-150 group ${
                    session.id === currentSessionId
                      ? "bg-accent/10 border-l-2 border-l-accent"
                      : ""
                  }`}
                >
                  <p className="font-mono text-xs text-zinc-300 truncate group-hover:text-accent transition-colors">
                    {session.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-zinc-600">
                      {timeAgo(session.lastActive)} ago
                    </span>
                    <span className="font-mono text-[10px] text-zinc-700">
                      {session.messageCount} msg{session.messageCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar footer CTA */}
        <div className="border-t border-border px-4 py-3">
          <a
            href="https://calendly.com/kian-jupitertech/cfd-ai-audit"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-3 py-2 text-[11px] font-sans text-zinc-400 hover:text-accent border border-border/60 rounded-lg hover:border-accent/30 hover:bg-accent/5 transition-all duration-200"
          >
            Want this for your whole team?{" "}
            <span className="text-accent font-medium">Book a free strategy call →</span>
          </a>
        </div>
      </div>

      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-black/40 z-30 sm:hidden"
        />
      )}
    </>
  );
}
