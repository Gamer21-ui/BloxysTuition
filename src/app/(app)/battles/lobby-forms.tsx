"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

export function BattleLobbyForms({ courses }: { courses: { id: string; title: string; code: string }[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"1v1" | "2v2">("1v1");
  const [course, setCourse] = useState("");
  const [rounds, setRounds] = useState(5);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true); setErr(null);
    const { data, error } = await createClient().rpc("create_battle", { p_mode: mode, p_course: course || null, p_rounds: rounds });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(`/battles/${data}`);
  }
  async function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(c)) return setErr("Codes are 5 letters/numbers");
    setBusy(true); setErr(null);
    const { error } = await createClient().rpc("join_battle", { p_code: c, p_team: null });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(`/battles/${c}`);
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-4">
        <h2 className="text-xl">Create a battle</h2>
        <div className="flex gap-2">
          {(["1v1", "2v2"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cn("btn flex-1", mode === m ? "btn-primary" : "btn-ghost")}>{m}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bc">Subject</label>
            <select id="bc" className="input" value={course} onChange={(e) => setCourse(e.target.value)}>
              <option value="">Mixed (all subjects)</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="br">Rounds</label>
            <select id="br" className="input" value={rounds} onChange={(e) => setRounds(+e.target.value)}>
              {[3, 5, 7, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary w-full" disabled={busy} onClick={create}>Create lobby</button>
      </Card>
      <Card>
        <h2 className="text-xl">Join with a code</h2>
        <form onSubmit={join} className="mt-4 space-y-3">
          <input className="input text-center font-display text-2xl uppercase tracking-[0.3em]" maxLength={5} value={code}
            onChange={(e) => setCode(e.target.value)} placeholder="ABC12" aria-label="Battle code" />
          <button className="btn btn-accent w-full" disabled={busy}>Join</button>
        </form>
        {err && <p className="mt-3 text-sm text-bad" role="alert">{err}</p>}
      </Card>
    </div>
  );
}
