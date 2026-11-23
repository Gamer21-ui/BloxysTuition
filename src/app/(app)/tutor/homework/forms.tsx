"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { createAssignment, releaseAnswers, tutorUploadUrl } from "../actions";

async function upload(bucket: "resources" | "solutions", folder: string, file: File) {
  const { path, token } = await tutorUploadUrl(bucket, folder, file.name);
  const { error } = await createClient().storage.from(bucket).uploadToSignedUrl(path, token, file);
  if (error) throw new Error(error.message);
  return path;
}

export function NewAssignment({ courses, chapters }: { courses: { id: string; title: string }[]; chapters: { id: string; course_id: string; number: string; title: string }[] }) {
  const router = useRouter();
  const [course, setCourse] = useState(courses[0]?.id || "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true); setMsg(null);
    try {
      const file = fd.get("file") as File | null;
      const file_path = file && file.size ? await upload("resources", `homework/${course}`, file) : null;
      const s = (k: string) => (String(fd.get(k) || "").trim() || null);
      await createAssignment({ course, chapter: s("chapter"), title: s("title"), kind: s("kind"), instructions: s("instructions"), due: s("due"), max_score: s("max_score"), xp_reward: s("xp_reward"), file_path });
      (e.target as HTMLFormElement).reset(); setMsg("Set ✔ Students were notified.");
      router.refresh();
    } catch (err) { setMsg((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <Card>
      <h2 className="mb-3 text-lg">Set new work</h2>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Subject</label>
          <select className="input" value={course} onChange={(e) => setCourse(e.target.value)}>{courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
        <div><label className="label">Chapter (optional)</label>
          <select name="chapter" className="input"><option value="">–</option>{chapters.filter((c) => c.course_id === course).map((c) => <option key={c.id} value={c.id}>{c.number}. {c.title}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label">Title</label><input name="title" required className="input" placeholder="Ch 3 ledgers worksheet" /></div>
        <div><label className="label">Type</label><select name="kind" className="input"><option>homework</option><option>worksheet</option><option>mock</option><option>paper</option></select></div>
        <div><label className="label">Due (Mauritius time)</label><input name="due" type="datetime-local" className="input" /></div>
        <div><label className="label">Marked out of</label><input name="max_score" type="number" defaultValue={20} min={1} className="input" /></div>
        <div><label className="label">XP for full marks</label><input name="xp_reward" type="number" defaultValue={80} min={0} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Instructions</label><textarea name="instructions" className="input min-h-[80px]" /></div>
        <div className="sm:col-span-2"><label className="label">Question file (optional)</label><input name="file" type="file" className="text-sm" /></div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn btn-primary" disabled={busy}>{busy ? "Setting…" : "Set it"}</button>
          {msg && <span className="text-sm text-muted">{msg}</span>}
        </div>
      </form>
    </Card>
  );
}

export function ReleaseAnswers({ id, released, video, hasSolution, hasScheme }: { id: string; released: boolean; video: string | null; hasSolution: boolean; hasScheme: boolean }) {
  const router = useRouter();
  const [sol, setSol] = useState<File | null>(null);
  const [ms, setMs] = useState<File | null>(null);
  const [vid, setVid] = useState(video || "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(release: boolean) {
    setBusy(true); setMsg(null);
    try {
      const solution_path = sol ? await upload("solutions", `assignments/${id}`, sol) : null;
      const mark_scheme_path = ms ? await upload("solutions", `assignments/${id}`, ms) : null;
      await releaseAnswers({ id, solution_path, mark_scheme_path, video: vid, release });
      setMsg(release ? "Released ✔" : "Saved (hidden)"); router.refresh();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-2 rounded border-2 border-dashed border-line p-3 text-sm sm:grid-cols-3">
      <label>Worked solutions {hasSolution && "✔"}<input type="file" className="mt-1 block w-full" onChange={(e) => setSol(e.target.files?.[0] || null)} /></label>
      <label>Mark scheme {hasScheme && "✔"}<input type="file" className="mt-1 block w-full" onChange={(e) => setMs(e.target.files?.[0] || null)} /></label>
      <label>Video link<input className="input mt-1" value={vid} onChange={(e) => setVid(e.target.value)} placeholder="https://" /></label>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-3">
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => go(released)}>Save files</button>
        <button className="btn btn-accent btn-sm" disabled={busy} onClick={() => go(!released)}>{released ? "Hide answers again" : "Release answers to students"}</button>
        {msg && <span className="text-muted">{msg}</span>}
      </div>
    </div>
  );
}
