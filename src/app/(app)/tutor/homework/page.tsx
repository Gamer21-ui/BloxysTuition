import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import { deleteAssignment, grade } from "../actions";
import { NewAssignment, ReleaseAnswers } from "./forms";

export const metadata: Metadata = { title: "Homework (tutor)" };
export const dynamic = "force-dynamic";

const f = (bucket: string, path: string) => `/api/files?bucket=${bucket}&path=${encodeURIComponent(path)}`;

export default async function TutorHomework() {
  await requireTutor();
  const admin = createAdminClient();
  const [{ data: courses }, { data: chapters }, { data: as }, { count: studentCount }] = await Promise.all([
    admin.from("courses").select("id, title").order("sort"),
    admin.from("chapters").select("id, course_id, number, title").order("sort"),
    admin.from("assignments").select("*, course:courses(title), submissions(id, file_paths, text_answer, submitted_at, score, feedback, graded_at, student:profiles(display_name))").order("created_at", { ascending: false }),
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student").eq("status", "approved"),
  ]);
  type Sub = { id: string; file_paths: string[]; text_answer: string | null; submitted_at: string; score: number | null; feedback: string | null; graded_at: string | null; student: { display_name: string } | null };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Homework</h1>
      <NewAssignment courses={courses || []} chapters={chapters || []} />
      <SectionTitle>Set work</SectionTitle>
      {!as?.length && <Empty>Nothing set yet.</Empty>}
      <div className="space-y-4">
        {(as || []).map((a) => {
          const subs = (a.submissions as Sub[]) || [];
          const toMark = subs.filter((s) => !s.graded_at).length;
          return (
            <details key={a.id} className="card" open={toMark > 0}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                <span className="flex-1"><b>{a.title}</b> <span className="text-sm text-muted">{(a.course as { title: string })?.title} · {a.kind} · {a.due_at ? `due ${fmtDateTime(a.due_at)}` : "no deadline"}</span></span>
                <span className="chip">{subs.length}/{studentCount || 0} in</span>
                {toMark > 0 && <span className="chip text-warn">{toMark} to mark</span>}
                {a.answers_released && <span className="chip text-good">answers out</span>}
              </summary>
              <div className="mt-4 space-y-3">
                {a.file_path && <a className="text-sm hover:underline" href={f("resources", a.file_path)} target="_blank">📄 Question file</a>}
                {subs.map((s) => (
                  <div key={s.id} className="rounded border-2 border-line p-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <b className="flex-1">{s.student?.display_name}</b>
                      <span className={a.due_at && s.submitted_at > a.due_at ? "text-bad" : "text-muted"}>{fmtDateTime(s.submitted_at)}{a.due_at && s.submitted_at > a.due_at ? " (late)" : ""}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-sm">
                      {s.file_paths.map((p) => <a key={p} className="chip hover:underline" href={f("submissions", p)} target="_blank">{p.split("/").pop()?.replace(/^\d+-/, "")}</a>)}
                    </div>
                    {s.text_answer && <p className="mt-2 whitespace-pre-wrap text-sm">{s.text_answer}</p>}
                    <form action={grade} className="mt-2 flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <div><label className="label">Score / {a.max_score}</label><input name="score" type="number" min={0} max={a.max_score} defaultValue={s.score ?? ""} required className="input w-24" /></div>
                      <div className="flex-1"><label className="label">Feedback</label><input name="feedback" defaultValue={s.feedback || ""} className="input" /></div>
                      <button className="btn btn-primary btn-sm">{s.graded_at ? "Update" : "Mark"}</button>
                    </form>
                  </div>
                ))}
                <ReleaseAnswers id={a.id} released={a.answers_released} video={a.solution_video_url} hasSolution={!!a.solution_path} hasScheme={!!a.mark_scheme_path} />
                <form action={deleteAssignment}><input type="hidden" name="id" value={a.id} /><button className="text-xs text-bad hover:underline">Delete this assignment (and its submissions)</button></form>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
