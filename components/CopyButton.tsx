"use client";

import { useState, useCallback } from "react";
import { CopyHookTooltip } from "./AuditCTA";

interface CopyButtonProps {
  text: string;
  showHook?: boolean;
}

/**
 * Convert basic markdown to HTML for rich clipboard paste.
 * Handles: headers, bold, italic, links, lists, hr, tables.
 * Google Docs reads HTML from clipboard; Notion reads both.
 */
function markdownToHtml(md: string): string {
  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr>");

  // Headers (must be before bold handling)
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(
    /^([ \t]*[-*] .+(?:\n[ \t]*[-*] .+)*)/gm,
    (match) => {
      const items = match
        .split("\n")
        .map((line) => `<li>${line.replace(/^[ \t]*[-*] /, "")}</li>`)
        .join("");
      return `<ul>${items}</ul>`;
    }
  );

  // Ordered lists
  html = html.replace(
    /^([ \t]*\d+\. .+(?:\n[ \t]*\d+\. .+)*)/gm,
    (match) => {
      const items = match
        .split("\n")
        .map((line) => `<li>${line.replace(/^[ \t]*\d+\. /, "")}</li>`)
        .join("");
      return `<ol>${items}</ol>`;
    }
  );

  // Tables (GFM)
  html = html.replace(
    /^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)+)/gm,
    (_, header, _separator, body) => {
      const thCells = header
        .split("|")
        .filter((c: string) => c.trim())
        .map((c: string) => `<th style="padding:4px 8px;border:1px solid #ccc;text-align:left">${c.trim()}</th>`)
        .join("");
      const rows = body
        .trim()
        .split("\n")
        .map((row: string) => {
          const cells = row
            .split("|")
            .filter((c: string) => c.trim())
            .map((c: string) => `<td style="padding:4px 8px;border:1px solid #ccc">${c.trim()}</td>`)
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");
      return `<table style="border-collapse:collapse"><thead><tr>${thCells}</tr></thead><tbody>${rows}</tbody></table>`;
    }
  );

  // Paragraphs: convert double newlines to paragraph breaks
  html = html
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      // Don't wrap blocks that are already HTML elements
      if (/^<(h[1-6]|ul|ol|table|hr|blockquote)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  return html;
}

export default function CopyButton({ text, showHook = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      // Write both plain text AND rich HTML to clipboard
      // Notion reads plain text (markdown), Google Docs reads HTML
      const htmlContent = markdownToHtml(text);
      const blob = new Blob([htmlContent], { type: "text/html" });
      const textBlob = new Blob([text], { type: "text/plain" });

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        }),
      ]);
    } catch {
      // Fallback for browsers that don't support ClipboardItem
      await navigator.clipboard.writeText(text);
    }

    setCopied(true);

    if (showHook) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
    }

    setTimeout(() => setCopied(false), 2000);
  }, [text, showHook]);

  return (
    <div className="relative">
      {showTooltip && <CopyHookTooltip />}
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono text-zinc-500 hover:text-accent border border-border rounded-md hover:border-accent/40 transition-all duration-200"
      >
        {copied ? (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}
