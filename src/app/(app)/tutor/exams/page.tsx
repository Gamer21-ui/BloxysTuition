import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, SectionTitle, StatusChip } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import { groupByLevel } from "@/lib/levels";
import { StatusForm } from "../status-form";
import { createExam, deleteExam, updateExam } from "../actions";

export const metadata: Metadata = { title: "Exams (tutor)" };
export const dynamic = "force-dynamic";

const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() + 4 * 3600_000).toISOString().slice(0, 16) : "");
const mmss = (ms: number) => `${Math.floor(ms / 60000)}m ${String(Math.round((ms % 60000) / 1000)).padStart(2, "0")}s`;

type Exam = { id: string; title: string; status: string; release_at: string | null; closes_at: string | null; max_attempts: number | null; time_limit_sec: number; question_count: number; course: { title: string; tier: string } };
type Att = { quiz_id: string; user_id: string; score: number | null; total: number | null; time_ms: number | null; focus_lost: number; flagged: boolean; finished_at: string | null; started_at: string };

export default async function TutorExams() {
  await requireTutor();
  const admin = createAdminClient();
  const now = new Date();
  const month = now.toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "Indian/Mauritius" });
  const [{ data: courses }, { data: exams }, { data: atts }, { data: studs }] = await Promise.all([
    admin.from("courses").select("id, title, tier").order("sort"),
    admin.from("quizzes").select("id, title, status, release_at, closes_at, max_attempts, time_limit_sec, question_count, course:courses(title, tier)").eq("kind", "exam").order("sort", { ascending: false }),
    admin.from("quiz_attempts").select("quiz_id, user_id, score, total, time_ms, focus_lost, flagged, finished_at, started_at, quiz:quizzes!inner(kind)").eq("quiz.kind", "exam").order("started_at"),
    admin.from("profiles").select("id, display_name, tier").eq("role", "student").eq("status", "approved").order("display_name"),
  ]);
  const list = (exams as unknown as Exam[]) || [];
  const attempts = (atts as unknown as Att[]) || [];

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Exams</h1>
      <p className="text-muted">Exams stay locked until you open them. Students see open and scheduled exams on their Exam prep page. During an exam the site goes full screen and counts every time a student leaves the page (switching tabs or apps). It can&apos;t stop them, but you&apos;ll see it below.</p>

      <SectionTitle>Create a monthly exam</SectionTitle>
      <Card>
        <form action={createExam} className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className="label">Title</label><input name="title" required defaultValue={`${month} monthly exam`} className="input" /></div>
          <div><label className="label">Subject</label>
            <select name="course" className="input">{groupByLevel(courses || []).map((g) => <optgroup key={g.level.id} label={g.level.label}>{g.items.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</optgroup>)}</select></div>
          <div><label className="label">Questions</label><input name="count" type="number" min={5} max={80} defaultValue={40} className="input" /></div>
          <div><label className="label">Minutes</label><input name="minutes" type="number" min={5} max={240} defaultValue={60} className="input" /></div>
          <div><label className="label">Attempts allowed (0 = unlimited)</label><input name="attempts" type="number" min={0} max={10} defaultValue={1} className="input" /></div>
          <div><label className="label">Opens (Mauritius time, empty = now)</label><input name="opens_at" type="datetime-local" className="input" /></div>
          <div><label className="label">Closes (empty = never)</label><input name="closes_at" type="datetime-local" className="input" /></div>
          <div><label className="label">XP for 100%</label><input name="xp" type="number" min={0} defaultValue={200} className="input" /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="draft" /> Save as draft (hidden, no announcement)</label>
          <button className="btn btn-primary">Create exam</button>
        </form>
        <p className="mt-2 text-xs text-muted">Questions are drawn at random from the subject&apos;s released chapters, so each student gets a different mix. Students in that level are notified and it&apos;s posted to Discord.</p>
      </Card>

      <SectionTitle>All exams</SectionTitle>
      <div className="space-y-4">
        {list.map((e) => {
          const mine = attempts.filter((a) => a.quiz_id === e.id);
          const who = (studs || []).filter((s) => s.tier === e.course?.tier || mine.some((a) => a.user_id === s.id));
          const done = new Set(mine.filter((a) => a.finished_at).map((a) => a.user_id));
          return (
            <details key={e.id} className="card">
              <summary className="flex cursor-pointer flex-wrap items-center gap-2">
                <span className="flex-1"><b>{e.title}</b> <span className="text-sm text-muted">{e.course?.title} · {e.question_count} Q · {Math.round(e.time_limit_sec / 60)} min{e.max_attempts ? ` · ${e.max_attempts} attempt${e.max_attempts > 1 ? "s" : ""}` : " · unlimited attempts"}{e.closes_at ? ` · closes ${fmtDateTime(e.closes_at)}` : ""}</span></span>
                <span className="chip">{done.size}/{who.length} done</span>
                <StatusChip status={e.status} />
              </summary>
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm"><b>Open / lock:</b> <StatusForm table="quizzes" id={e.id} status={e.status} releaseAt={e.release_at} /></div>
                <form action={updateExam} className="flex flex-wrap items-end gap-2 text-sm">
                  <input type="hidden" name="id" value={e.id} />
                  <label>Questions<input name="count" type="number" min={5} max={80} defaultValue={e.question_count} className="input h-8 w-20 py-0" /></label>
                  <label>Minutes<input name="minutes" type="number" min={5} max={240} defaultValue={Math.round(e.time_limit_sec / 60)} className="input h-8 w-20 py-0" /></label>
                  <label>Attempts<input name="attempts" type="number" min={0} max={10} defaultValue={e.max_attempts ?? 0} className="input h-8 w-16 py-0" /></label>
                  <label>Closes<input name="closes_at" type="datetime-local" defaultValue={toLocal(e.closes_at)} className="input h-8 w-auto py-0" /></label>
                  <button className="btn btn-ghost btn-sm">Save</button>
                </form>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-muted"><th className="py-1">Student</th><th>Best</th><th>Attempts</th><th>Time</th><th>Left the page</th><th>Last</th></tr></thead>
                    <tbody className="divide-y divide-line">
                      {who.map((s) => {
                        const a = mine.filter((x) => x.user_id === s.id);
                        const fin = a.filter((x) => x.finished_at);
                        const best = fin.length ? fin.reduce((m, x) => ((x.score ?? 0) / (x.total || 1) > (m.score ?? 0) / (m.total || 1) ? x : m)) : null;
                        const left = a.reduce((n, x) => n + (x.focus_lost || 0), 0);
                        return (
                          <tr key={s.id}>
                            <td className="py-1.5 font-bold">{s.display_name}</td>
                            <td>{best ? <b>{Math.round((100 * (best.score ?? 0)) / (best.total || 1))}%</b> : a.length ? <span className="text-warn">in progress</span> : <span className="text-muted">not started</span>}</td>
                            <td>{a.length}</td>
                            <td>{best?.time_ms ? mmss(best.time_ms) : "–"}</td>
                            <td className={left >= 3 ? "font-bold text-bad" : left ? "text-warn" : "text-muted"}>{left}×{best?.flagged ? " · flagged" : ""}</td>
                            <td className="text-muted">{a.length ? fmtDateTime(a[a.length - 1].finished_at || a[a.length - 1].started_at) : "–"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <details className="text-xs"><summary className="cursor-pointer text-bad">Delete this exam…</summary>
                  <form action={deleteExam} className="mt-1"><input type="hidden" name="id" value={e.id} /><button className="btn btn-danger btn-sm">Yes, delete the exam and all its results</button></form></details>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
