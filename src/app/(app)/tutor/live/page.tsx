import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VIZZES, taskCount } from "@/lib/viz";
import { GoLiveButton } from "@/components/viz/go-live";
import { fmtDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Live lessons" };
export const dynamic = "force-dynamic";

export default async function TutorLive() {
  await requireTutor();
  const sb = await createClient();
  const [{ data: live, error }, { data: recent }] = await Promise.all([
    sb.from("live_sessions").select("id, viz, step").eq("status", "live").maybeSingle(),
    sb.from("live_sessions").select("id, viz, started_at, ended_at, live_answers(correct)").order("started_at", { ascending: false }).limit(10),
  ]);
  const courses = [...new Set(VIZZES.map((v) => v.course))];
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="page-title">🎬 Live lessons</h1>
        <p className="text-muted">Start a lesson and every student in that course gets a <b>LIVE</b> banner. You control the steps; they answer the checkpoints on their phones, and you see every answer as it comes in.</p>
      </div>
      {error && <div className="rounded border-2 border-warn bg-warn/10 p-3 text-sm">Run the <b>2026-11-27-live-lessons.sql</b> update in Supabase first.</div>}
      {live && <a href="/live" className="block rounded-xl border-2 border-red-500 bg-red-500/10 p-3 font-bold">🔴 A lesson is live right now: open the cockpit →</a>}
      {courses.map((c) => (
        <section key={c}>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">{c.replace(/^o-/, "O Level ").replace(/^as-/, "AS ").replace(/^a-/, "A Level ").replace(/-/g, " ")}</div>
          <div className="grid gap-3 sm:grid-cols-2">
            {VIZZES.filter((v) => v.course === c).map((v) => (
              <div key={v.id} className="card space-y-2">
                <div className="flex items-start gap-3">
                  <div className="text-4xl">{v.emoji}</div>
                  <div className="min-w-0 flex-1"><div className="font-display text-lg leading-tight">{v.title}</div><div className="text-xs text-muted">Chapter {v.chapter} · {v.steps.length} steps · {taskCount(v)} checkpoints</div></div>
                </div>
                <p className="text-sm text-muted">{v.blurb}</p>
                <div className="flex gap-2"><GoLiveButton viz={v.id} /><a href={`/viz/${v.id}`} className="btn btn-ghost btn-sm">Preview</a></div>
              </div>
            ))}
          </div>
        </section>
      ))}
      {!!recent?.length && (
        <section>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Recent lessons</div>
          <ul className="space-y-1">
            {recent.map((r) => {
              const a = (r.live_answers as unknown as { correct: boolean }[]) || [];
              return <li key={r.id} className="flex justify-between rounded bg-surface2 px-3 py-2 text-sm"><span>{VIZZES.find((v) => v.id === r.viz)?.title || r.viz}</span><span className="text-muted">{fmtDateTime(r.started_at)} · {a.filter((x) => x.correct).length}/{a.length} answers right</span></li>;
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
