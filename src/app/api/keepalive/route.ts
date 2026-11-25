import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Called once a day by Vercel Cron (see vercel.json) so the free Supabase project
 * sees some database activity and isn't paused during quiet weeks (e.g. holidays).
 * If CRON_SECRET is set in Vercel, only Vercel's cron can call it.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const admin = createAdminClient();
  await admin.rpc("season_tick"); // start/end leaderboard seasons on time, even if nobody opens the leaderboard
  const { count, error } = await admin.from("courses").select("id", { count: "exact", head: true });
  if (error) return NextResponse.json({ ok: false }, { status: 500 });
  return NextResponse.json({ ok: true, courses: count, at: new Date().toISOString() });
}
