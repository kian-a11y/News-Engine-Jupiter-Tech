"use client";

import MarkdownRenderer from "./MarkdownRenderer";
import CopyButton from "./CopyButton";
import { PostOutputCTA } from "./AuditCTA";
import { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
  showCTA?: boolean;
  showCopyHook?: boolean;
  isStreaming?: boolean;
  isLast?: boolean;
  onRefine?: (prompt: string) => void;
}

const REFINE_ACTIONS = [
  { label: "Shorter", prompt: "Make the above output shorter and more concise, keeping the key data points." },
  { label: "More Detail", prompt: "Expand the above output with more detail, additional instruments, and deeper analysis." },
  { label: "Change Tone", prompt: "Rewrite the above output in a more casual, social-media-friendly tone." },
  { label: "Regenerate", prompt: "Regenerate the above output completely with a fresh perspective." },
];

export default function ChatMessage({
  message,
  showCTA = false,
  showCopyHook = false,
  isStreaming = false,
  isLast = false,
  onRefine,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const isWelcome = message.id === "welcome";
  const isLongMessage = message.content.length > 500;
  const wordCount = message.content.split(/\s+/).filter(Boolean).length;

  return (
    <div
      className={`animate-fade-in flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
    >
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser
            ? "bg-accent/20 border border-accent/40 rounded-2xl rounded-br-sm px-4 py-3"
            : isWelcome
              ? "bg-surface/50 border border-dashed border-accent/20 rounded-2xl rounded-bl-sm px-4 py-3"
              : "bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3"
        }`}
      >
        {isUser ? (
          <p className="font-sans text-sm text-zinc-200 whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <>
            {isWelcome && (
              <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-accent/10">
                <span className="text-accent text-xs">✦</span>
                <span className="font-mono text-[10px] text-accent/60 uppercase tracking-wider">Welcome</span>
              </div>
            )}
            {/* Top copy button for long messages */}
            {isLongMessage && !isStreaming && !isWelcome && (
              <div className="flex justify-end mb-2 pb-2 border-b border-border/50">
                <CopyButton text={message.content} />
              </div>
            )}
            <MarkdownRenderer content={message.content} />
            {/* Streaming indicator with word count */}
            {isStreaming && isLast && message.content.length > 0 && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="font-mono text-[10px] text-zinc-600">
                  Generating... {wordCount} words
                </span>
              </div>
            )}
            {/* Bottom copy button + CTA (not shown while streaming) */}
            {!isStreaming && !isWelcome && message.content.length > 0 && (
              <div className="flex justify-end mt-2 pt-2 border-t border-border/50">
                <CopyButton text={message.content} showHook={showCopyHook} />
              </div>
            )}
            {/* Refine buttons on last assistant message */}
            {!isStreaming && isLast && !isWelcome && onRefine && message.content.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {REFINE_ACTIONS.map(a => (
                  <button
                    key={a.label}
                    onClick={() => onRefine(a.prompt)}
                    className="px-2 py-0.5 text-[10px] font-mono text-zinc-600 border border-border/50 rounded hover:text-accent hover:border-accent/30 transition-all"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
            {showCTA && <PostOutputCTA />}
          </>
        )}
      </div>
    </div>
  );
}
