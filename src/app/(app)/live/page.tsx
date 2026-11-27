import type { Metadata } from "next";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { vizById } from "@/lib/viz";
import { NOTES } from "@/lib/viz/notes";
import { takes } from "@/lib/subjects";
import { LiveRoom, type LiveAnswer, type LiveSession } from "@/components/viz/live-room";

export const metadata: Metadata = { title: "Live lesson" };
export const dynamic = "force-dynamic";

export default async function Live({ searchParams }: { searchParams: Promise<{ present?: string }> }) {
  const me = await requireApproved();
  const { present } = await searchParams;
  const sb = await createClient();
  const { data: s, error } = await sb.from("live_sessions").select("*").eq("status", "live").order("started_at", { ascending: false }).limit(1).maybeSingle();
  const viz = s ? vizById(s.viz) : null;
  if (error || !s || !viz) {
    return (
      <div className="card mx-auto max-w-lg space-y-3 text-center">
        <div className="text-5xl">📡</div>
        <h1 className="font-display text-2xl">No live lesson right now</h1>
        <p className="text-muted">When your tutor starts one, a <b>LIVE</b> banner pops up and you can join from anywhere.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/play/replays" className="btn btn-primary">📼 Lesson replays</Link>
          {me.role === "tutor" && <Link href="/tutor/live" className="btn btn-ghost">🎬 Start a live lesson</Link>}
        </div>
      </div>
    );
  }
  const tutor = me.role === "tutor";
  const role = tutor ? (present ? "present" : "tutor") : "student";
  let roster: { id: string; name: string }[] | undefined;
  if (role === "tutor") {
    const { data: studs } = await sb.from("profiles").select("id, display_name, tier, subjects").eq("role", "student").eq("status", "approved").order("display_name");
    const oLevel = viz.course.startsWith("o-");
    roster = (studs || [])
      .filter((p) => takes({ role: "student", subjects: p.subjects }, viz.course) && (oLevel ? p.tier === "O" : p.tier !== "O"))
      .map((p) => ({ id: p.id, name: p.display_name }));
  }
  const { data: ans } = await sb.from("live_answers").select("user_id, step, answer, correct, xp, coins").eq("session_id", s.id);
  return (
    <div className={role === "tutor" ? "mx-auto max-w-7xl" : "mx-auto max-w-5xl"}>
      <h1 className="mb-3 font-display text-2xl sm:text-3xl">{viz.emoji} {viz.title}</h1>
      <LiveRoom initial={s as LiveSession} meId={me.id} meName={me.display_name} role={role}
        notes={role === "tutor" ? NOTES[viz.id] : undefined} roster={roster} answers={(ans || []) as LiveAnswer[]} />
    </div>
  );
}
