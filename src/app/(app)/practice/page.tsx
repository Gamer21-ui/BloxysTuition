import type { Metadata } from "next";
import Link from "next/link";
import { Clock, GraduationCap, RefreshCcw } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { fmtDate, isLive, timeUntil } from "@/lib/utils";
import { ScoreChart } from "./score-chart";

export const metadata: Metadata = { title: "Exam prep" };
export const dynamic = "force-dynamic";

const EXAMS_START = new Date("2027-10-01T00:00:00+04:00"); // Cambridge Oct/Nov series

type Course = { id: string; title: string; color: string; sort: number };
type Quiz = { id: string; course_id: string; kind: string; title: string; status: string; release_at: string | null; time_limit_sec: number | null; question_count: number | null };

export default async function Practice() {
  const me = await requireApproved();
  const sb = await createClient();
  const [{ data: courses }, { data: quizzes }, { data: deck }, { data: attempts }] = await Promise.all([
    sb.from("courses").select("id, title, color, sort").eq("active", true).order("sort"),
    sb.from("quizzes").select("id, course_id, kind, title, status, release_at, time_limit_sec, question_count").in("kind", ["exam", "review"]),
    sb.from("review_items").select("course_id, due_at, box").eq("user_id", me.id),
    sb.from("quiz_attempts").select("quiz_id, score, total, finished_at, time_ms, flagged, quiz:quizzes!inner(kind, course_id)")
      .eq("user_id", me.id).eq("quiz.kind", "exam").not("finished_at", "is", null).order("finished_at"),
  ]);
  const cs = (courses as Course[]) || [];
  const qz = ((quizzes as Quiz[]) || []).filter((q) => isLive(q.status, q.release_at));
  const now = Date.now();
  const items = deck || [];
  const dueTotal = items.filter((d) => +new Date(d.due_at) <= now).length;
  type Att = { score: number; total: number; finished_at: string; time_ms: number; flagged: boolean; quiz: { course_id: string } };
  const exams = ((attempts as unknown as Att[]) || []).filter((a) => !a.flagged);
  const weeks = Math.max(0, Math.ceil((+EXAMS_START - now) / (7 * 86400_000)));

  // chart: one row per attempt, value in that subject's column
  const rows = exams.map((a) => {
    const c = cs.find((x) => x.id === a.quiz.course_id);
    return { label: fmtDate(a.finished_at), [c?.id || "x"]: Math.round((100 * a.score) / a.total) };
  });
  const series = cs.filter((c) => exams.some((a) => a.quiz.course_id === c.id)).map((c) => ({ key: c.id, name: c.title.replace(/^O Level /, ""), color: c.color }));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="page-title mb-0">Exam prep</h1>
        <span className="chip text-base"><Clock size={16} aria-hidden="true" /> about {weeks} weeks to the Oct–Nov 2027 exams</span>
      </div>

      <SectionTitle>🔁 Fix my mistakes {dueTotal > 0 && <span className="chip ml-2 bg-warn text-white">{dueTotal} due</span>}</SectionTitle>
      <p className="-mt-1 mb-3 text-sm text-muted">Every question you get wrong comes back the next day. Get it right and it returns after 3 days, then 7. Right three times in a row and it&apos;s mastered.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cs.map((c) => {
          const mine = items.filter((d) => d.course_id === c.id);
          const due = mine.filter((d) => +new Date(d.due_at) <= now).length;
          const next = mine.filter((d) => +new Date(d.due_at) > now).sort((a, b) => +new Date(a.due_at) - +new Date(b.due_at))[0];
          const rq = qz.find((q) => q.kind === "review" && q.course_id === c.id);
          return (
            <Card key={c.id} className="flex flex-col">
              <div className="text-sm font-bold" style={{ color: c.color }}>{c.title.replace(/^O Level /, "")}</div>
              <div className="mt-1 font-display text-3xl">{due}<span className="text-base text-muted"> due</span></div>
              <div className="text-xs text-muted">{mine.length} in your deck{next && !due ? ` · next one ${timeUntil(next.due_at)}` : ""}</div>
              {rq && due > 0
                ? <Link href={`/quiz/${rq.id}`} className="btn btn-primary btn-sm mt-3"><RefreshCcw size={14} aria-hidden="true" /> Fix {Math.min(due, 10)} now</Link>
                : <span className="btn btn-ghost btn-sm mt-3 pointer-events-none opacity-60">{mine.length ? "Nothing due yet" : "No mistakes yet"}</span>}
            </Card>
          );
        })}
      </div>

      <SectionTitle>🎓 Timed exam practice</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {cs.map((c) => {
          const ex = qz.find((q) => q.kind === "exam" && q.course_id === c.id);
          if (!ex) return null;
          const mine = exams.filter((a) => a.quiz.course_id === c.id);
          const pcts = mine.map((a) => Math.round((100 * a.score) / a.total));
          const best = pcts.length ? Math.max(...pcts) : null;
          const last = pcts.length ? pcts[pcts.length - 1] : null;
          return (
            <Card key={c.id} className="flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center text-white" style={{ background: c.color, borderRadius: "calc(var(--radius)*.6)" }}><GraduationCap size={22} aria-hidden="true" /></div>
                <div>
                  <div className="font-bold">{c.title.replace(/^O Level /, "")}</div>
                  <div className="text-sm text-muted">{ex.title}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded bg-surface2 p-2"><div className="font-display text-xl">{mine.length}</div>attempts</div>
                <div className="rounded bg-surface2 p-2"><div className="font-display text-xl">{last === null ? "–" : `${last}%`}</div>last</div>
                <div className="rounded bg-surface2 p-2"><div className="font-display text-xl">{best === null ? "–" : `${best}%`}</div>best</div>
              </div>
              <Link href={`/quiz/${ex.id}`} className="btn btn-primary mt-1">Start timed test</Link>
            </Card>
          );
        })}
      </div>

      <SectionTitle>📈 Your exam scores over time</SectionTitle>
      {rows.length ? <Card><ScoreChart rows={rows} series={series} /></Card> : <Empty>Sit your first timed test and your scores will show up here.</Empty>}
    </div>
  );
}
