"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Order Race: pick a topic and rounds, then post the challenge in chat (or just share the code). */
export function OrderRaceLobby({ courseId, chapters }: { courseId: string; chapters: { id: string; number: string; title: string }[] }) {
  const router = useRouter();
  const [chapter, setChapter] = useState("");
  const [rounds, setRounds] = useState(5);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create(post: boolean) {
    setBusy(true); setErr(null);
    const sb = createClient();
    const { data: code, error } = await sb.rpc("create_battle", { p_mode: "1v1", p_course: chapter ? null : courseId, p_chapter: chapter || null, p_rounds: rounds, p_style: "race" });
    if (error) { setBusy(false); return setErr(error.message); }
    if (post) {
      const { error: e2 } = await sb.rpc("post_chat", { p_body: msg.trim(), p_battle_code: code });
      if (e2) { setBusy(false); return setErr(e2.message); }
    }
    router.push(`/battles/${code}`);
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="font-display text-3xl">🏁 Order Race 1v1</h1>
        <p className="mt-1 text-muted">Each round shows some shuffled steps. Tap them into the right order and lock in.
          The fastest <b className="text-ink">fully correct</b> order scores the most. A wrong order scores 0, so speed only helps if you&apos;re right.</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {["PC", "MAR", "MDR", "CIR"].map((x, i) => (
            <span key={x} className="flex items-center gap-2"><span className="chip font-bold">{i + 1}. {x}</span>{i < 3 && <span className="text-muted">→</span>}</span>
          ))}
        </div>
        <p className="mt-3 text-sm">🏆 Win: <b>60 XP + 10 coins</b> · 🤝 Draw: 35 XP · 💪 Lose: 20 XP <span className="text-muted">(5 rewarded races a day)</span></p>
      </div>

      <div className="card space-y-3">
        <div>
          <span className="label">Topic</span>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setChapter("")} className={cn("btn btn-sm", chapter === "" ? "btn-primary" : "btn-ghost")}>🎲 Mix of everything</button>
            {chapters.map((c) => (
              <button key={c.id} type="button" onClick={() => setChapter(c.id)} className={cn("btn btn-sm", chapter === c.id ? "btn-primary" : "btn-ghost")}>{c.number}. {c.title}</button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
          <div>
            <label className="label" htmlFor="rr">Rounds</label>
            <select id="rr" className="input" value={rounds} onChange={(e) => setRounds(+e.target.value)}>
              {[3, 5, 7].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="rm">Message in chat (optional)</label>
            <input id="rm" className="input" maxLength={200} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Race me! Loser buys the snacks 😤" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-accent flex-1" disabled={busy} onClick={() => create(true)}>Post challenge in chat</button>
          <button className="btn btn-ghost" disabled={busy} onClick={() => create(false)}>Just give me a code</button>
        </div>
        {err && <p className="text-sm text-bad" role="alert">{err}</p>}
      </div>
    </div>
  );
}
