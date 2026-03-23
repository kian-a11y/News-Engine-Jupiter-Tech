import Header from "@/components/Header";
import ChatWindow from "@/components/ChatWindow";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

async function getNewsCount(): Promise<number> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("news_items")
      .select("*", { count: "exact", head: true })
      .gte("published_at", oneDayAgo);

    if (count && count > 0) return count;

    // Fallback: count all items if none from last 24h
    const { count: totalCount } = await supabase
      .from("news_items")
      .select("*", { count: "exact", head: true });

    return totalCount || 0;
  } catch {
    return 0;
  }
}

async function getUserEmail(): Promise<string | null> {
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
        },
      }
    );
    const { data } = await supabase.auth.getUser();
    return data.user?.email || null;
  } catch {
    return null;
  }
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const [newsCount, userEmail] = await Promise.all([getNewsCount(), getUserEmail()]);

  return (
    <main className="h-screen flex flex-col bg-background overflow-hidden">
      <Header />
      <ChatWindow newsCount={newsCount} userEmail={userEmail} />
    </main>
  );
}
