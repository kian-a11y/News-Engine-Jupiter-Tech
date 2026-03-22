import { getServiceClient } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const runtime = "nodejs";

/**
 * Verify the requesting user via Supabase auth cookie.
 * Returns the user's email or null if unauthenticated.
 */
async function getAuthenticatedEmail(): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    return data.user?.email || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Authenticate: only return sessions belonging to the requesting user
    const authedEmail = await getAuthenticatedEmail();
    if (!authedEmail) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServiceClient();

    // Get session_ids owned by this user from usage_tracking
    const { data: userSessions } = await supabase
      .from("usage_tracking")
      .select("session_id")
      .eq("user_email", authedEmail);

    const ownedSessionIds = Array.from(
      new Set((userSessions || []).map((r: { session_id: string }) => r.session_id))
    );

    if (ownedSessionIds.length === 0) {
      return Response.json({ sessions: [] });
    }

    // Fetch chat history only for owned sessions
    const { data: sessions, error } = await supabase
      .from("chat_history")
      .select("session_id, role, content, created_at")
      .in("session_id", ownedSessionIds)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[Sessions] Error:", error);
      return Response.json({ error: "Failed to load sessions" }, { status: 500 });
    }

    // Group by session_id
    const sessionMap = new Map<string, { title: string; lastActive: string; messageCount: number }>();
    for (const row of sessions || []) {
      const existing = sessionMap.get(row.session_id);
      if (!existing) {
        sessionMap.set(row.session_id, {
          title: row.content.substring(0, 80),
          lastActive: row.created_at,
          messageCount: 1,
        });
      } else {
        existing.messageCount++;
        existing.title = row.content.substring(0, 80);
      }
    }

    const result = Array.from(sessionMap.entries())
      .map(([id, data]) => ({
        id,
        title: data.title,
        lastActive: data.lastActive,
        messageCount: data.messageCount,
      }))
      .sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());

    return Response.json({ sessions: result });
  } catch (err) {
    console.error("[Sessions] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
