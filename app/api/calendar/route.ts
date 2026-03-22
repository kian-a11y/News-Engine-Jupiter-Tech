import { getWeekEvents } from "@/lib/economic-calendar";

export const runtime = "nodejs";

export async function GET() {
  try {
    const events = await getWeekEvents();
    return Response.json({ events });
  } catch (err) {
    console.error("[Calendar API] Error:", err);
    return Response.json({ events: [] }, { status: 500 });
  }
}
