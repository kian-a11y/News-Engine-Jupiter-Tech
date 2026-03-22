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

export async function GET(req: Request) {
  try {
    // Authenticate
    const authedEmail = await getAuthenticatedEmail();
    if (!authedEmail) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) {
      return Response.json({ error: "Missing session_id" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Verify this session belongs to the requesting user
    const { data: ownership } = await supabase
      .from("usage_tracking")
      .select("id")
      .eq("session_id", sessionId)
      .eq("user_email", authedEmail)
      .limit(1);

    if (!ownership || ownership.length === 0) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const { data: messages, error } = await supabase
      .from("chat_history")
      .select("role, content, created_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Messages] Error:", error);
      return Response.json({ error: "Failed to load messages" }, { status: 500 });
    }

    return Response.json({
      messages: (messages || []).map((m, i) => ({
        id: `${sessionId}_${i}`,
        role: m.role,
        content: m.content,
      })),
    });
  } catch (err) {
    console.error("[Messages] Error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
