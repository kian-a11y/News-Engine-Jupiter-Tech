"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import QuickActions from "./QuickActions";
import TypingIndicator from "./TypingIndicator";
import ChatSidebar from "./ChatSidebar";
import DateRangeFilter from "./DateRangeFilter";
import MarketPulse from "./MarketPulse";
import { UsageMilestoneBanner } from "./AuditCTA";
import { ChatMessage as ChatMessageType, DateRange } from "@/lib/types";
import { addTimeSaved } from "@/lib/time-saved";

function generateSessionId(): string {
  return crypto.randomUUID();
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

interface ChatWindowProps {
  newsCount: number;
  userEmail: string | null;
}

function makeWelcome(newsCount: number, topHeadline?: string, topSource?: string, nextEvent?: string, nextEventTime?: string): ChatMessageType {
  const lines = [`**${newsCount || 0} stories loaded** | Market data live`];
  if (topHeadline) {
    lines.push(`\n**Top Story:** ${topHeadline}${topSource ? ` — *${topSource}*` : ""}`);
  }
  if (nextEvent) {
    lines.push(`\n**Next Event:** ${nextEvent}${nextEventTime ? ` at ${nextEventTime} UTC` : ""}`);
  }
  lines.push(`\nUse the quick actions below or ask me anything about today's markets.\n\n*This is just one of 100+ workflows inside Jupiter Tech's operating system for brokers. [See what else your team could automate →](https://calendly.com/kian-jupitertech/cfd-ai-audit)*`);

  return {
    id: "welcome",
    role: "assistant",
    content: lines.join("\n"),
  };
}

export default function ChatWindow({ newsCount, userEmail }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marketPulseOpen, setMarketPulseOpen] = useState(false);
  const [milestoneDismissed, setMilestoneDismissed] = useState(false);
  const [draftInput, setDraftInput] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>({
    preset: "today",
    from: todayISO(),
    to: todayISO(),
  });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef("");

  // Initialize session
  useEffect(() => {
    const stored = localStorage.getItem("fx_session_id");
    sessionId.current = stored || generateSessionId();
    if (!stored) localStorage.setItem("fx_session_id", sessionId.current);

    // Start with basic welcome, then enhance with live data
    setMessages([makeWelcome(newsCount)]);

    // Fetch top headline + next calendar event for dynamic welcome
    Promise.all([
      fetch(`/api/headlines?from=${todayISO()}&to=${todayISO()}`).then(r => r.json()).catch(() => ({ headlines: [] })),
      fetch("/api/calendar").then(r => r.json()).catch(() => ({ events: [] })),
    ]).then(([headlineData, calendarData]) => {
      const top = headlineData.headlines?.[0];
      const now = new Date();
      const upcoming = (calendarData.events || [])
        .filter((e: { impact: string; event_time: string }) => e.impact === "HIGH" && new Date(e.event_time) > now)
        .sort((a: { event_time: string }, b: { event_time: string }) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime());
      const nextEvt = upcoming[0];

      const enhanced = makeWelcome(
        newsCount,
        top?.title,
        top?.source_name,
        nextEvt?.event_name ? `${nextEvt.currency} ${nextEvt.event_name}` : undefined,
        nextEvt?.event_time ? new Date(nextEvt.event_time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) : undefined,
      );
      setMessages([enhanced]);
    });
  }, [newsCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Set sidebar + Market Pulse defaults based on screen size (client-only to avoid hydration mismatch)
  useEffect(() => {
    const smMq = window.matchMedia("(min-width: 640px)");
    setSidebarOpen(smMq.matches);

    const lgMq = window.matchMedia("(min-width: 1024px)");
    setMarketPulseOpen(lgMq.matches);
    const handler = (e: MediaQueryListEvent) => setMarketPulseOpen(e.matches);
    lgMq.addEventListener("change", handler);
    return () => lgMq.removeEventListener("change", handler);
  }, []);

  const handleNewChat = useCallback(() => {
    const newId = generateSessionId();
    sessionId.current = newId;
    localStorage.setItem("fx_session_id", newId);
    setMessages([makeWelcome(newsCount)]);
    setSidebarOpen(false);
  }, [newsCount]);

  const handleSelectSession = useCallback(
    async (selectedSessionId: string) => {
      sessionId.current = selectedSessionId;
      localStorage.setItem("fx_session_id", selectedSessionId);
      setSidebarOpen(false);

      try {
        const res = await fetch(
          `/api/sessions/messages?session_id=${encodeURIComponent(selectedSessionId)}`
        );
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([makeWelcome(newsCount)]);
        }
      } catch {
        setMessages([makeWelcome(newsCount)]);
      }
    },
    [newsCount]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessageType = {
        id: "user_" + Date.now(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      const assistantId = "assistant_" + Date.now();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      let streamSuccess = false;
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            session_id: sessionId.current,
            date_from: dateRange.from,
            date_to: dateRange.to,
          }),
        });

        // Handle daily usage limit
        if (res.status === 429) {
          const errData = await res.json();
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, content: errData.error || "Daily limit reached. Please try again tomorrow." }
                : msg
            )
          );
          setIsStreaming(false);
          return;
        }

        if (!res.ok) throw new Error("Chat request failed");

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No reader");

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: msg.content + parsed.text }
                      : msg
                  )
                );
              }
            } catch (parseErr) {
              if (
                parseErr instanceof Error &&
                parseErr.message !== "Stream error"
              ) {
                // skip malformed JSON
              } else {
                throw parseErr;
              }
            }
          }
        }
        streamSuccess = true;
      } catch (err) {
        console.error("Chat error:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    "I apologise, but I encountered an error processing your request. Please try again.",
                }
              : msg
          )
        );
      } finally {
        setIsStreaming(false);
        if (streamSuccess) {
          setMessages((prev) => {
            const assistantMsg = prev.find((m) => m.id === assistantId);
            if (assistantMsg && assistantMsg.content) {
              const wordCount = assistantMsg.content.trim().split(/\s+/).length;
              addTimeSaved(wordCount);
              window.dispatchEvent(new Event("timesaved"));
            }
            return prev;
          });
        }
      }
    },
    [isStreaming, dateRange]
  );

  return (
    <>
      <ChatSidebar
        currentSessionId={sessionId.current}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        userEmail={userEmail}
      />
      <MarketPulse
        dateRange={dateRange}
        isOpen={marketPulseOpen}
        onToggle={() => setMarketPulseOpen((o) => !o)}
        onChatAbout={sendMessage}
      />
      <div
        className={`relative z-10 flex flex-col h-[calc(100vh-52px)] transition-all duration-300 ${
          sidebarOpen ? "sm:ml-72" : ""
        } ${marketPulseOpen ? "lg:mr-80" : ""}`}
      >
        {/* Date range filter */}
        <DateRangeFilter dateRange={dateRange} onChange={setDateRange} newsCount={newsCount} />

        {/* Chat messages area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {(() => {
            // Count assistant messages (excluding welcome) for CTA logic
            let assistantCount = 0;
            return messages.map((msg) => {
              if (msg.role === "assistant" && msg.id !== "welcome") {
                assistantCount++;
              }
              // Show post-output CTA after 4th, then every 3rd assistant response
              const showCTA =
                msg.role === "assistant" &&
                msg.id !== "welcome" &&
                assistantCount >= 4 &&
                (assistantCount - 4) % 3 === 0 &&
                msg.content.length > 100;
              // Show copy hook tooltip on responses that don't have the CTA
              const showCopyHook =
                msg.role === "assistant" &&
                msg.id !== "welcome" &&
                !showCTA &&
                assistantCount >= 2;
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  showCTA={showCTA}
                  showCopyHook={showCopyHook}
                  isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id}
                  isLast={msg.id === messages[messages.length - 1]?.id}
                  onRefine={sendMessage}
                />
              );
            });
          })()}
          {/* Usage milestone banner — shown once after 3rd output */}
          {!milestoneDismissed &&
            messages.filter(
              (m) => m.role === "assistant" && m.id !== "welcome"
            ).length >= 5 && (
              <UsageMilestoneBanner
                onDismiss={() => setMilestoneDismissed(true)}
              />
            )}
          {isStreaming && (
            <div className="flex justify-start mb-4">
              <TypingIndicator />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick actions + input */}
        <QuickActions onAction={setDraftInput} disabled={isStreaming} />
        <ChatInput onSend={sendMessage} disabled={isStreaming} draftInput={draftInput} onDraftConsumed={() => setDraftInput("")} />
      </div>
    </>
  );
}
