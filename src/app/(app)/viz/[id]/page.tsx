import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { vizById, taskCount } from "@/lib/viz";
import { VizReplay } from "@/components/viz/replay";
import { fmtDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Interactive lesson" };
export const dynamic = "force-dynamic";

export default async function VizPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireApproved();
  const { id } = await params;
  const viz = vizById(id);
  if (!viz) notFound();
  // your most recent live result for this lesson (if the live-lessons update is in)
  const sb = await createClient();
  const { data: sess } = await sb.from("live_sessions").select("id, started_at").eq("viz", id).order("started_at", { ascending: false }).limit(10);
  let past: { correct: number; total: number; when: string } | null = null;
  if (sess?.length) {
    const { data: ans } = await sb.from("live_answers").select("session_id, correct").eq("user_id", me.id).in("session_id", sess.map((s) => s.id));
    const last = sess.find((s) => (ans || []).some((a) => a.session_id === s.id));
    if (last) {
      const mine = (ans || []).filter((a) => a.session_id === last.id);
      past = { correct: mine.filter((a) => a.correct).length, total: taskCount(viz), when: fmtDate(last.started_at) };
    }
  }
  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/courses/${viz.course}/${viz.chapter}`} className="text-sm text-muted hover:underline">← Chapter {viz.chapter}</Link>
      <h1 className="page-title mt-1">{viz.emoji} {viz.title}</h1>
      <VizReplay id={viz.id} past={past} />
    </div>
  );
}
