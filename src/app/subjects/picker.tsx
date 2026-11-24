"use client";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { Icon } from "@/components/icon";
import { saveSubjects } from "./actions";

export type SubjectOption = { key: string; name: string; color: string; icon: string; courses: string[] };

export function SubjectPicker({ options, initial }: { options: SubjectOption[]; initial: string[] }) {
  const [picked, setPicked] = useState<string[]>(initial.filter((k) => options.some((o) => o.key === k)));
  const [err, setErr] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const toggle = (k: string) => setPicked((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((o) => {
          const on = picked.includes(o.key);
          return (
            <button key={o.key} type="button" onClick={() => toggle(o.key)} aria-pressed={on}
              className={`card flex items-center gap-3 text-left transition ${on ? "ring-4 ring-primary" : "opacity-80 hover:opacity-100"}`}>
              <div className="grid h-12 w-12 shrink-0 place-items-center text-white" style={{ background: o.color, borderRadius: "calc(var(--radius)*.7)" }}><Icon name={o.icon} size={24} /></div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl">{o.name}</div>
                <div className="text-xs text-muted">{o.courses.join(" · ")}</div>
              </div>
              <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${on ? "border-primary bg-primary text-white" : "border-line"}`}>{on && <Check size={16} />}</div>
            </button>
          );
        })}
      </div>
      {err && <p className="mt-3 text-sm font-bold text-bad">{err}</p>}
      <button className="btn btn-primary mt-5 w-full" disabled={busy || !picked.length}
        onClick={() => start(async () => { setErr(null); const r = await saveSubjects(picked); if (r?.error) setErr(r.error); })}>
        {busy ? "Saving…" : picked.length ? `Save ${picked.length} subject${picked.length > 1 ? "s" : ""}` : "Pick at least one"}
      </button>
    </div>
  );
}
