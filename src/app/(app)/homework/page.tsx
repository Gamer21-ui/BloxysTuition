import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import { SubmitBox } from "./submit-box";

export const metadata: Metadata = { title: "Homework" };
export const dynamic = "force-dynamic";

type A = {
  id: string; title: string; kind: string; instructions: string | null; file_path: string | null; due_at: string | null;
  max_score: number; xp_reward: number; answers_released: boolean; solution_path: string | null; mark_scheme_path: string | null;
  solution_video_url: string | null; course: { title: string; color: string } | null;
};
type S = { assignment_id: string; file_paths: string[]; text_answer: string | null; submitted_at: string; score: number | null; feedback: string | null; graded_at: string | null };

const f = (bucket: string, path: string) => `/api/files?bucket=${bucket}&path=${encodeURIComponent(path)}`;

export default async function Homework() {
  const me = await requireApproved();
  const sb = await createClient();
  const [{ data: as }, { data: subs }] = await Promise.all([
    sb.from("assignments").select("id, title, kind, instructions, file_path, due_at, max_score, xp_reward, answers_released, solution_path, mark_scheme_path, solution_video_url, course:courses(title, color)").order("due_at", { ascending: true, nullsFirst: false }),
    sb.from("submissions").select("assignment_id, file_paths, text_answer, submitted_at, score, feedback, graded_at").eq("user_id", me.id),
  ]);
  const byA = new Map((subs as S[] | null || []).map((s) => [s.assignment_id, s]));
  const list = (as as unknown as A[]) || [];
  const todo = list.filter((a) => !byA.has(a.id));
  const done = list.filter((a) => byA.has(a.id));

  const Item = ({ a }: { a: A }) => {
    const s = byA.get(a.id);
    const late = a.due_at && new Date(a.due_at) < new Date() && !s;
    return (
      <Card className="space-y-3" id={a.id}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase" style={{ color: a.course?.color }}>{a.course?.title} · {a.kind}</div>
            <h3 className="text-xl">{a.title}</h3>
            <div className={`text-sm ${late ? "text-bad" : "text-muted"}`}>{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No deadline"} · up to {a.xp_reward + 20} XP</div>
          </div>
          {s?.graded_at ? <span className="chip text-good">{s.score} / {a.max_score}</span> : s ? <span className="chip text-accent">handed in</span> : late ? <span className="chip text-bad">overdue</span> : <span className="chip text-warn">to do</span>}
        </div>
        {a.instructions && <p className="whitespace-pre-wrap text-sm">{a.instructions}</p>}
        {a.file_path && <a className="btn btn-ghost btn-sm" href={f("resources", a.file_path)} target="_blank" rel="noopener">📄 Download the questions</a>}
        {s?.feedback && <div className="rounded border-2 border-line bg-surface2 p-3 text-sm"><b>Feedback:</b> <span className="whitespace-pre-wrap">{s.feedback}</span></div>}
        {s && s.file_paths.length > 0 && (
          <div className="flex flex-wrap gap-2 text-sm">
            {s.file_paths.map((p) => <a key={p} className="chip hover:underline" href={f("submissions", p)} target="_blank" rel="noopener">{p.split("/").pop()?.replace(/^\d+-/, "")}</a>)}
          </div>
        )}
        {a.answers_released && (
          <div className="flex flex-wrap gap-2">
            {a.solution_path && <a className="btn btn-accent btn-sm" href={f("solutions", a.solution_path)} target="_blank" rel="noopener">✅ Worked solutions</a>}
            {a.mark_scheme_path && <a className="btn btn-accent btn-sm" href={f("solutions", a.mark_scheme_path)} target="_blank" rel="noopener">📝 Mark scheme</a>}
            {a.solution_video_url && <a className="btn btn-accent btn-sm" href={a.solution_video_url} target="_blank" rel="noopener">▶️ Walkthrough video</a>}
          </div>
        )}
        {!s?.graded_at && <SubmitBox assignmentId={a.id} resubmit={!!s} />}
      </Card>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">Homework</h1>
      <p className="text-muted">Hand in before the deadline to count for the “on time” quests. Photos of written work are fine.</p>
      <SectionTitle>To do ({todo.length})</SectionTitle>
      {todo.length ? <div className="space-y-4">{todo.map((a) => <Item key={a.id} a={a} />)}</div> : <Empty>All caught up 🎉</Empty>}
      <SectionTitle>Handed in ({done.length})</SectionTitle>
      {done.length ? <div className="space-y-4">{done.map((a) => <Item key={a.id} a={a} />)}</div> : <Empty>Nothing handed in yet.</Empty>}
    </div>
  );
}
