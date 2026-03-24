import Anthropic from "@anthropic-ai/sdk";
import { getServiceClient } from "@/lib/supabase";
import { buildSystemPrompt } from "@/lib/system-prompt";
import { fetchNewsForRange } from "@/lib/news-query";
import { rankByImpact } from "@/lib/impact-score";
import { getRelevantMarketData } from "@/lib/market-data";
import { getUpcomingEvents } from "@/lib/economic-calendar";
import { chatLimiter } from "@/lib/rate-limit";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

const DAILY_LIMIT = 15;

function getAnthropicClient() {
  return new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
}

function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function POST(req: Request) {
  try {
    const { message, session_id, date_from, date_to } = await req.json();

    if (!message || !session_id) {
      return Response.json({ error: "Missing message or session_id" }, { status: 400 });
    }

    // ─── Server-side auth: extract user from cookie ─────────────
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
    );
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user?.email) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }
    const user_email = user.email;

    // ─── Rate limiting ─────────────────────────────────────────
    const { allowed, retryAfterMs } = chatLimiter.check(user_email);
    if (!allowed) {
      return Response.json(
        { error: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } }
      );
    }

    const supabase = getServiceClient();

    // ─── Daily usage limit check ─────────────────────────────────
    const { start, end } = getTodayRange();
    const { count } = await supabase
      .from("usage_tracking")
      .select("*", { count: "exact", head: true })
      .eq("user_email", user_email)
      .gte("created_at", start)
      .lt("created_at", end);

    if ((count || 0) >= DAILY_LIMIT) {
      return Response.json({
        error: `You've reached your daily limit of ${DAILY_LIMIT} outputs. Limits reset at midnight.\n\nThis content engine is just one workflow inside Jupiter Tech's broker OS. Want unlimited access for your whole team?\n\n[See the full platform →](https://calendly.com/kian-jupitertech/cfd-ai-audit)`,
      }, { status: 429 });
    }

    // ─── Fetch all data in parallel ──────────────────────────────
    const from = date_from || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const to = date_to || new Date().toISOString();

    const [rawNews, calendarEvents] = await Promise.all([
      fetchNewsForRange(supabase, from, to, 150),
      getUpcomingEvents().catch(() => []),
    ]);

    const news = rankByImpact(rawNews, 50);

    // Get market data relevant to today's news (smart matching)
    const marketData = await getRelevantMarketData(news).catch(() => []);

    // ─── Data freshness tracking ─────────────────────────────────
    // Find the most recent scraped_at from news items for freshness indicator
    const newsScrapedAt = rawNews.length > 0
      ? rawNews.reduce((latest, item) => {
          const scraped = item.scraped_at;
          return scraped && scraped > (latest || "") ? scraped : latest;
        }, "" as string) || null
      : null;

    const marketUpdatedAt = marketData.length > 0
      ? marketData[0]?.updated_at || null
      : null;

    const systemPrompt = buildSystemPrompt(news, marketData, calendarEvents, {
      newsScrapedAt,
      marketUpdatedAt,
    });

    // Save user message
    await supabase.from("chat_history").insert({
      session_id,
      role: "user",
      content: message,
    });

    // Load recent conversation history (last 10 messages = 5 exchanges max)
    const { data: history } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("session_id", session_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Reverse to chronological order
    history?.reverse();

    // Sanitize: Claude requires strictly alternating user/assistant messages
    const rawMessages = (history || []).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const conversationMessages: { role: "user" | "assistant"; content: string }[] = [];
    for (const msg of rawMessages) {
      const lastRole = conversationMessages[conversationMessages.length - 1]?.role;
      if (lastRole === msg.role) {
        conversationMessages[conversationMessages.length - 1].content += "\n\n" + msg.content;
      } else {
        conversationMessages.push({ ...msg });
      }
    }

    // Ensure the conversation starts with a user message
    while (conversationMessages.length > 0 && conversationMessages[0].role !== "user") {
      conversationMessages.shift();
    }

    if (conversationMessages.length === 0) {
      conversationMessages.push({ role: "user" as const, content: message });
    }

    // Stream Claude response
    const anthropic = getAnthropicClient();
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 16384,
      system: systemPrompt,
      messages: conversationMessages,
    });

    const encoder = new TextEncoder();
    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }

          // Save assistant response
          await supabase.from("chat_history").insert({
            session_id,
            role: "assistant",
            content: fullResponse,
          });

          // Track usage AFTER successful response (not before)
          // This way users don't lose daily quota on failed/error responses
          if (user_email && fullResponse.length > 0) {
            await supabase.from("usage_tracking").insert({
              user_email,
              session_id,
            });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err);
          const errStatus = (err as { status?: number })?.status;
          const errBody = (err as { error?: unknown })?.error;
          console.error("[Chat] Stream error:", errMsg, "status:", errStatus, "body:", JSON.stringify(errBody));
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errMsg || "Stream error" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[Chat] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
