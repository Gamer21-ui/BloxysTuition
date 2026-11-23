"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { addResource, tutorUploadUrl } from "../../actions";

export function ResourceUploader({ courseId, chapterId }: { courseId: string; chapterId: string | null }) {
  const router = useRouter();
  const [section, setSection] = useState<"class" | "library">("class");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      let file_path: string | null = null;
      if (file) {
        const { path, token } = await tutorUploadUrl("resources", `${courseId}/${chapterId || "general"}`, file.name);
        const { error } = await createClient().storage.from("resources").uploadToSignedUrl(path, token, file);
        if (error) throw new Error(error.message);
        file_path = path;
      }
      await addResource({ course: courseId, chapter: chapterId, section, title: title || file?.name || "Resource", kind, file_path, url: url || null });
      setTitle(""); setFile(null); setUrl(""); setMsg("Added ✔");
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch (err) { setMsg((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={go} className="grid gap-2 rounded border-2 border-dashed border-line p-3 sm:grid-cols-2">
      <select className="input" value={section} onChange={(e) => setSection(e.target.value as "class" | "library")} aria-label="Section">
        <option value="class">Class notes (your own)</option>
        <option value="library">Library (ready-made)</option>
      </select>
      <select className="input" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
        {["pdf", "worksheet", "video", "image", "link", "other"].map((k) => <option key={k}>{k}</option>)}
      </select>
      <input className="input sm:col-span-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="file" className="text-sm" onChange={(e) => setFile(e.target.files?.[0] || null)} aria-label="File" />
      <input className="input" placeholder="…or a https:// link" value={url} onChange={(e) => setUrl(e.target.value)} />
      <div className="flex items-center gap-3 sm:col-span-2">
        <button className="btn btn-primary btn-sm" disabled={busy || (!file && !url)}>{busy ? "Uploading…" : "Add file"}</button>
        {msg && <span className="text-sm text-muted">{msg}</span>}
      </div>
    </form>
  );
}
