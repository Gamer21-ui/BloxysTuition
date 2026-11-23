import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, SectionTitle, StatusChip } from "@/components/ui";
import { StatusForm } from "../../status-form";
import { addPart, addQuestion, deleteQuestion, deleteResource, savePart } from "../../actions";
import { ResourceUploader } from "./resource-uploader";
import { QuestionEditor } from "./question-editor";

export const metadata: Metadata = { title: "Edit chapter" };
export const dynamic = "force-dynamic";

export default async function EditChapter({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: id } = await params;
  await requireTutor();
  const admin = createAdminClient();
  const { data: ch } = await admin.from("chapters").select("id, number, title, status, release_at, course:courses(id, title, slug)").eq("id", id).maybeSingle();
  if (!ch) notFound();
  const course = ch.course as unknown as { id: string; title: string; slug: string };
  const [{ data: parts }, { data: quizzes }, { data: resources }] = await Promise.all([
    admin.from("parts").select("*").eq("chapter_id", id).order("sort"),
    admin.from("quizzes").select("id, title, kind, status, release_at, xp_reward, questions(id, prompt, options, explanation, battle_ok, question_keys(correct))").eq("chapter_id", id).order("sort"),
    admin.from("resources").select("id, title, section, kind, file_path, url, status, release_at").eq("chapter_id", id).order("created_at"),
  ]);
  type Q = { id: string; prompt: string; options: string[]; explanation: string | null; battle_ok: boolean; question_keys: { correct: number } | { correct: number }[] | null };
  const correctOf = (q: Q) => (Array.isArray(q.question_keys) ? q.question_keys[0]?.correct : q.question_keys?.correct);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/tutor/content" className="text-sm text-muted hover:underline">← Content</Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="page-title mb-0 flex-1">{course.title} · {ch.number}. {ch.title}</h1>
        <Link href={`/courses/${course.slug}/${ch.number}`} className="btn btn-ghost btn-sm">View as student</Link>
      </div>
      <div className="mt-2"><StatusForm table="chapters" id={ch.id} status={ch.status} releaseAt={ch.release_at} /></div>

      <SectionTitle>Parts (lesson notes)</SectionTitle>
      <div className="space-y-3">
        {(parts || []).map((p) => (
          <details key={p.id} className="card">
            <summary className="flex cursor-pointer flex-wrap items-center gap-2 font-bold">{p.number}. {p.title} <StatusChip status={p.status} /></summary>
            <div className="mt-3 space-y-3">
              <StatusForm table="parts" id={p.id} status={p.status} releaseAt={p.release_at} />
              <form action={savePart} className="space-y-2">
                <input type="hidden" name="id" value={p.id} />
                <input name="title" className="input" defaultValue={p.title} aria-label="Title" />
                <textarea name="body" className="input min-h-[220px] font-mono text-sm" defaultValue={p.body || ""} placeholder={"Markdown: **bold**, *italic*, - lists, ## headings, [link](https://...)"} />
                <input name="video_url" className="input" defaultValue={p.video_url || ""} placeholder="YouTube / Drive video link (optional)" />
                <button className="btn btn-primary btn-sm">Save part</button>
              </form>
            </div>
          </details>
        ))}
        <form action={addPart} className="card flex flex-wrap gap-2">
          <input type="hidden" name="chapter" value={ch.id} />
          <input name="number" className="input w-24" placeholder={`${ch.number}.x`} />
          <input name="title" required className="input flex-1" placeholder="New part title (starts as draft)" />
          <button className="btn btn-ghost btn-sm">Add part</button>
        </form>
      </div>

      <SectionTitle>Files: Library &amp; Class notes</SectionTitle>
      <Card className="space-y-3">
        {(resources || []).map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 border-b-2 border-line pb-2 text-sm last:border-0">
            <span className="chip">{r.section === "class" ? "Class notes" : "Library"}</span>
            <span className="flex-1 font-bold">{r.title}</span>
            {r.file_path && <a className="hover:underline" href={`/api/files?bucket=resources&path=${encodeURIComponent(r.file_path)}`} target="_blank">open</a>}
            {r.url && <a className="hover:underline" href={r.url} target="_blank" rel="noopener">link</a>}
            <StatusForm table="resources" id={r.id} status={r.status} releaseAt={r.release_at} />
            <form action={deleteResource}><input type="hidden" name="id" value={r.id} /><button className="text-xs text-bad hover:underline">delete</button></form>
          </div>
        ))}
        <ResourceUploader courseId={course.id} chapterId={ch.id} />
      </Card>

      <SectionTitle>Quizzes</SectionTitle>
      <div className="space-y-4">
        {(quizzes || []).map((z) => (
          <Card key={z.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex-1 text-lg font-bold">{z.title} <span className="text-sm font-normal text-muted">{z.kind} · {z.xp_reward} XP</span></span>
              <StatusForm table="quizzes" id={z.id} status={z.status} releaseAt={z.release_at} />
            </div>
            <ol className="list-decimal space-y-2 pl-6 text-sm">
              {((z.questions as Q[]) || []).map((q) => (
                <li key={q.id}>
                  <div className="flex gap-2"><span className="flex-1">{q.prompt}</span>
                    <form action={deleteQuestion}><input type="hidden" name="id" value={q.id} /><button className="text-xs text-bad hover:underline">delete</button></form></div>
                  <div className="text-muted">{q.options.map((o, i) => <span key={i} className={i === correctOf(q) ? "font-bold text-good" : ""}>{i > 0 && " · "}{o}</span>)}</div>
                  {q.explanation && <div className="text-xs text-muted">💡 {q.explanation}</div>}
                  <QuestionEditor q={q} correct={correctOf(q)} />
                </li>
              ))}
            </ol>
            <details>
              <summary className="cursor-pointer text-sm font-bold">+ Add a question</summary>
              <form action={addQuestion} className="mt-2 grid gap-2">
                <input type="hidden" name="quiz" value={z.id} />
                <textarea name="prompt" required className="input" placeholder="Question" />
                {[0, 1, 2, 3].map((i) => (
                  <label key={i} className="flex items-center gap-2">
                    <input type="radio" name="correct" value={i} defaultChecked={i === 0} aria-label={`Option ${i + 1} is correct`} />
                    <input name={`o${i}`} className="input" placeholder={`Option ${i + 1}${i < 2 ? "" : " (optional)"}`} required={i < 2} />
                  </label>
                ))}
                <input name="explanation" className="input" placeholder="Why the answer is right (shown after)" />
                <button className="btn btn-primary btn-sm">Add question</button>
                <p className="text-xs text-muted">Tick the circle next to the correct option. Students see the options in this order, so don't always put the right answer first.</p>
              </form>
            </details>
          </Card>
        ))}
      </div>
    </div>
  );
}
