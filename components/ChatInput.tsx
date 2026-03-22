"use client";

import { useState, useRef, useEffect } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative z-10 px-4 pb-4 pt-2 bg-surface/60 backdrop-blur-sm">
      <div className="flex items-end gap-2 bg-background border border-border rounded-xl focus-within:border-accent/50 focus-within:shadow-[0_0_15px_rgba(240,180,41,0.1)] transition-all duration-300">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about today's market news..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent px-4 py-3.5 text-sm font-mono text-foreground placeholder:text-zinc-600 outline-none resize-none disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="m-1.5 px-4 py-2.5 bg-accent text-background font-sans font-semibold text-sm rounded-lg hover:bg-accent-dim transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="text-center text-[11px] text-zinc-600 mt-2 font-sans">
        Powered by Jupiter Tech
      </p>
    </div>
  );
}
