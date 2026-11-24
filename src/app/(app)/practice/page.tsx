import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Clock, GraduationCap, Lock, RefreshCcw } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { fmtDate, isLive, timeUntil } from "@/lib/utils";
import { ScoreChart } from "./score-chart";
import { LevelEmpty, LevelTabs } from "@/components/level-tabs";
import { inLevel, pickLevel } from "@/lib/levels";
import { takes } from "@/lib/subjects";


export const metadata: Metadata = { title: "Exam prep" };
export const dynamic = "force-dynamic";

const EXAMS_START = new Date("2027-10-01T00:00:00+04:00"); // Cambridge Oct/Nov series

type Course = { id: string; title: string; color: string; sort: number; tier: string };
type Quiz = { id: string; course_id: string; kind: string; title: string; status: string; release_at: string | null; time_limit_sec: number | null; question_count: number | null; closes_at: string | null; max_attempts: number | null; sort: number };

export default async function Practice({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const me = await requireApproved();
  const level = pickLevel((await searchParams).level, me.tier);
  const sb = await createClient();
  const [{ data: courses }, { data: quizzes }, { data: deck }, { data: attempts }] = await Promise.all([
    sb.from("courses").select("id, slug, title, color, sort, tier").eq("active", true).order("sort"),
    sb.from("quizzes").select("id, course_id, kind, title, status, release_at, time_limit_sec, question_count, closes_at, max_attempts, sort").in("kind", ["exam", "review"]),
    sb.from("review_items").select("course_id, due_at, box").eq("user_id", me.id),
    sb.from("quiz_attempts").select("quiz_id, score, total, finished_at, time_ms, flagged, quiz:quizzes!inner(kind, course_id)")
      .eq("user_id", me.id).eq("quiz.kind", "exam").order("started_at"),
  ]);
  const allCourses = ((courses as (Course & { slug: string })[]) || []).filter((c) => takes(me, c.slug));
  const cs = allCourses.filter((c) => inLevel(c.tier, level));
  const allQz = (quizzes as Quiz[]) || [];
  const qz = allQz.filter((q) => isLive(q.status, q.release_at));
  const now = Date.now();
  const items = (deck || []).filter((d) => cs.some((c) => c.id === d.course_id));
  const dueTotal = items.filter((d) => +new Date(d.due_at) <= now).length;
  type Att = { quiz_id: string; score: number; total: number; finished_at: string | null; time_ms: number; flagged: boolean; quiz: { course_id: string } };
  const allAtts = (attempts as unknown as Att[]) || [];
  const exams = allAtts.filter((a) => a.finished_at && !a.flagged && cs.some((c) => c.id === a.quiz.course_id));
  const examList = allQz.filter((q) => q.kind === "exam" && cs.some((c) => c.id === q.course_id))
    .map((q) => {
      const open = isLive(q.status, q.release_at) && (!q.closes_at || +new Date(q.closes_at) > now);
      const used = allAtts.filter((a) => a.quiz_id === q.id).length;
      const left = q.max_attempts ? Math.max(0, q.max_attempts - used) : null;
      const state = q.closes_at && +new Date(q.closes_at) <= now ? "closed" : open ? (left === 0 ? "done" : "open") : q.status === "scheduled" ? "soon" : "locked";
      return { q, state, left, mine: allAtts.filter((a) => a.quiz_id === q.id && a.finished_at && !a.flagged) };
    })
    .sort((a, b) => ["open", "soon", "done", "closed", "locked"].indexOf(a.state) - ["open", "soon", "done", "closed", "locked"].indexOf(b.state) || b.q.sort - a.q.sort);
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

      <LevelTabs current={level} base="/practice" counts={{ O: allCourses.filter((c) => inLevel(c.tier, "O")).length, A: allCourses.filter((c) => inLevel(c.tier, "A")).length }} />
      {!cs.length && <LevelEmpty level={level} />}
      {cs.length > 0 && <>
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

      <SectionTitle>🎓 Exams</SectionTitle>
      {!examList.length && <Empty>No exams yet. Your tutor will open them here.</Empty>}
      <div className="grid gap-3 sm:grid-cols-2">
        {examList.map(({ q, state, left, mine }) => {
          const c = cs.find((x) => x.id === q.course_id)!;
          const pcts = mine.map((a) => Math.round((100 * a.score) / a.total));
          const best = pcts.length ? Math.max(...pcts) : null;
          return (
            <Card key={q.id} className={`flex flex-col gap-2 ${state === "open" ? "ring-2 ring-primary" : state === "locked" || state === "closed" ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center text-white" style={{ background: c.color, borderRadius: "calc(var(--radius)*.6)" }}>
                  {state === "locked" ? <Lock size={20} aria-hidden="true" /> : <GraduationCap size={22} aria-hidden="true" />}
                </div>
                <div className="min-w-0">
                  <div className="font-bold">{q.title}</div>
                  <div className="text-sm text-muted">{c.title.replace(/^(O|AS|A) Level /, "")} · {q.question_count} questions · {Math.round((q.time_limit_sec || 0) / 60)} min</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {q.closes_at && state !== "closed" && <span className="chip"><CalendarClock size={12} aria-hidden="true" /> closes {timeUntil(q.closes_at)}</span>}
                {left !== null && <span className="chip">{left} attempt{left === 1 ? "" : "s"} left</span>}
                {best !== null && <span className="chip">best {best}%</span>}
              </div>
              {state === "open" && <Link href={`/quiz/${q.id}`} className="btn btn-primary mt-auto">Start exam</Link>}
              {state === "soon" && <span className="btn btn-ghost pointer-events-none mt-auto">Opens {q.release_at ? fmtDate(q.release_at, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "soon"}</span>}
              {state === "locked" && <span className="btn btn-ghost pointer-events-none mt-auto">Locked: your tutor will open it</span>}
              {state === "done" && <span className="btn btn-ghost pointer-events-none mt-auto">Done ✔</span>}
              {state === "closed" && <span className="btn btn-ghost pointer-events-none mt-auto">Closed</span>}
            </Card>
          );
        })}
      </div>

      <SectionTitle>📈 Your exam scores over time</SectionTitle>
      {rows.length ? <Card><ScoreChart rows={rows} series={series} /></Card> : <Empty>Sit your first timed test and your scores will show up here.</Empty>}
      </>}
    </div>
  );
}
