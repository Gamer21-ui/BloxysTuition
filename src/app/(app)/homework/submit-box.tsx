"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getUploadUrl, submitHomework } from "./actions";

const MAX = 25 * 1024 * 1024;

export function SubmitBox({ assignmentId, resubmit }: { assignmentId: string; resubmit: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(!resubmit);
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true); setStatus(null);
    try {
      const sb = createClient();
      const paths: string[] = [];
      for (const [i, file] of files.entries()) {
        if (file.size > MAX) throw new Error(`${file.name} is over 25 MB`);
        setStatus(`Uploading ${i + 1}/${files.length}…`);
        const { path, token } = await getUploadUrl(assignmentId, file.name);
        const { error } = await sb.storage.from("submissions").uploadToSignedUrl(path, token, file);
        if (error) throw new Error(error.message);
        paths.push(path);
      }
      await submitHomework({ assignmentId, paths, text });
      setStatus("Handed in ✔"); setFiles([]); setText(""); setOpen(false);
      router.refresh();
    } catch (e) {
      setStatus((e as Error).message);
    } finally { setBusy(false); }
  }

  if (!open) return <button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Replace my submission</button>;
  return (
    <div className="space-y-2 rounded border-2 border-dashed border-line p-3">
      <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt" className="block w-full text-sm"
        onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))} aria-label="Files to hand in" />
      <textarea className="input min-h-[80px]" placeholder="Or type your answer / a note for your tutor" value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} />
      <div className="flex items-center gap-3">
        <button className="btn btn-primary btn-sm" disabled={busy || (!files.length && !text.trim())} onClick={send}>{busy ? "Sending…" : resubmit ? "Hand in again" : "Hand in"}</button>
        {status && <span className="text-sm text-muted" role="status">{status}</span>}
      </div>
    </div>
  );
}
