import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VIZZES, taskCount } from "@/lib/viz";
import { takes } from "@/lib/subjects";
import { VizCard } from "@/components/game-card";
import { fmtDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Lesson replays" };
export const dynamic = "force-dynamic";

const COURSE_NAME: Record<string, string> = { "o-computer-science": "O Level Computer Science", "as-computer-science": "AS Level Computer Science", "a-computer-science": "A Level Computer Science" };

export default async function Replays() {
  const me = await requireApproved();
  const sb = await createClient();
  // my live results, per lesson (most recent session I answered in)
  const { data: mine } = await sb.from("live_answers").select("correct, session:live_sessions(viz, started_at)").eq("user_id", me.id).order("created_at", { ascending: false }).limit(500);
  type Row = { correct: boolean; session: { viz: string; started_at: string } | null };
  const last = new Map<string, { when: string; right: number; n: number }>();
  for (const r of ((mine || []) as unknown as Row[])) {
    if (!r.session) continue;
    const cur = last.get(r.session.viz);
    if (cur && cur.when !== r.session.started_at) continue;   // only the latest session per lesson
    const v = cur || { when: r.session.started_at, right: 0, n: 0 };
    v.n++; if (r.correct) v.right++;
    last.set(r.session.viz, v);
  }
  const tutor = me.role === "tutor";
  const courses = Object.keys(COURSE_NAME).filter((c) => tutor || (takes(me, c) && (c.startsWith("o-") ? me.tier === "O" : me.tier !== "O")));
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">📼 Lesson replays</h1>
      <p className="text-muted">Every interactive lesson from class, ready to replay at your own pace. Beat your live score!</p>
      {courses.map((c) => {
        const vs = VIZZES.filter((v) => v.course === c);
        if (!vs.length) return null;
        return (
          <section key={c}>
            <div className="mt-5 text-xs font-bold uppercase tracking-wider text-muted">{COURSE_NAME[c]}</div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {vs.map((v) => {
                const l = last.get(v.id);
                return <VizCard key={v.id} v={v} done={l ? `Live on ${fmtDate(l.when)}: you got ${l.right}/${taskCount(v)} right` : null} />;
              })}
            </div>
          </section>
        );
      })}
      {!courses.some((c) => VIZZES.some((v) => v.course === c)) && <p className="card mt-5 text-center text-muted">No interactive lessons for your subjects yet. They&apos;re coming! ✨</p>}
    </div>
  );
}
