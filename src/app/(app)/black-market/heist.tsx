"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Confetti } from "@/components/confetti";
import { cn } from "@/lib/utils";
import { apologise } from "./heist-actions";

type St = { vault: number; customer: boolean; bought: number; regular: boolean; held: number; came: number; trusted: boolean; grudge: boolean;
  next_at: string | null; last: { status: string; loot: number; at: string } | null; owner_online: boolean };
type Run = { id: string; seconds: number; questions: { prompt: string; options: string[] }[] };
type Result = { success: boolean; correct: number; chance: number; loot: number; pct: number | null; answers: number[] };

/** 💰 The vault behind Mr. Shades: unlock checklist → crack 3 dials (questions) → escape or get caught. */
export function Heist({ onLine, initial }: { onLine: (s: string) => void; initial?: St }) {
  const router = useRouter();
  const sb = createClient();
  const [st, setSt] = useState<St | null>(initial ?? null);
  const [run, setRun] = useState<Run | null>(null);
  const [ans, setAns] = useState<number[]>([]);
  const [left, setLeft] = useState(0);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sorry, setSorry] = useState("");
  const [chat, setChat] = useState<{ from: "me" | "seller"; text: string }[]>([]);
  const sent = useRef(false);

  const load = () => sb.rpc("heist_status").then(({ data, error }) => { if (!error) setSt(data as St); });
  useEffect(() => { if (!initial) load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // the clock while cracking
  useEffect(() => {
    if (!run || res) return;
    const end = Date.now() + run.seconds * 1000;
    const t = setInterval(() => { const l = Math.max(0, Math.ceil((end - Date.now()) / 1000)); setLeft(l); if (l === 0) finish(); }, 250);
    return () => clearInterval(t);
  }, [run, res]); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setBusy(true); setErr(null); setRes(null); setAns([]); sent.current = false;
    const { data, error } = await sb.rpc("heist_start");
    setBusy(false);
    if (error) return setErr(error.message.charAt(0).toUpperCase() + error.message.slice(1) + ".");
    setRun(data as Run); setLeft((data as Run).seconds);
    onLine("\"…*yawns, turns his back for a moment*…\"");
  }
  async function finish(final?: number[]) {
    if (!run || sent.current) return;
    sent.current = true;
    const { data, error } = await sb.rpc("heist_finish", { p_heist: run.id, p_answers: final ?? ans });
    if (error) { setErr(error.message); return; }
    const r = data as Result;
    setRes(r);
    onLine(r.success ? "\"…wait. WAIT. My VAULT! Come back here, kid!!\"" : "\"Well, well, WELL. Hand in my vault? I TRUSTED you. Prices just went up 50%. For you. Forever.\"");
    load(); router.refresh();
  }
  function pick(i: number) {
    const next = [...ans, i];
    setAns(next);
    if (run && next.length >= run.questions.length) finish(next);
  }
  async function sayVerySorry(e: React.FormEvent) {
    e.preventDefault();
    const text = sorry.trim(); if (!text) return;
    setSorry(""); setBusy(true); setChat((c) => [...c, { from: "me", text }]);
    const r = await apologise(text);
    setBusy(false);
    if (!r.ok) { setChat((c) => c.slice(0, -1)); onLine(r.error.startsWith("\"") ? r.error : `"${r.error}"`); return; }
    setChat((c) => [...c, { from: "seller", text: r.reply }]);
    onLine(`"${r.reply}"`);
    if (r.forgiven) { load(); router.refresh(); }
  }

  if (!st) return null;
  const unlocked = st.customer && st.regular && st.trusted;
  const steps = [
    { ok: st.customer, label: "Customer", how: st.customer ? `bought ${st.bought} thing${st.bought === 1 ? "" : "s"}` : "buy something from him first" },
    { ok: st.regular, label: "Regular", how: st.held >= 3 ? `${st.came}/${st.held} classes in 30 days (need 75%)` : "come to at least 3 classes (75%+)" },
    { ok: st.trusted, label: "Trusted", how: st.trusted ? "you charmed him and shook on a deal" : "really charm him in a haggle, then shake on the deal" },
  ];

  return (
    <div className="mt-6 rounded-xl border border-yellow-400/30 bg-gradient-to-b from-yellow-900/20 to-black/40 p-4 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono text-lg font-bold tracking-widest">[$] THE VAULT</div>
        <div className="rounded border border-yellow-400/40 bg-black/40 px-3 py-1 font-mono text-sm font-bold text-yellow-300">$ {st.vault.toLocaleString()} inside</div>
      </div>
      <p className="mt-1 text-xs text-white/60">Every coin Mr. Shades has ever been paid sits behind him. Crack the 3 dials (questions, 45 seconds) while he isn&apos;t looking. Each right answer raises your odds: 25% → 45% → 65% → 85%.
        Escape and you keep <b className="text-yellow-300">50–75% of the vault</b>. Get caught and his prices are <b className="text-red-300">+50% for you</b> until you talk him into forgiving you. One try a week.</p>

      {st.grudge ? (
        <div className="mt-3 rounded-lg border border-red-500/50 bg-red-950/40 p-3">
          <div className="font-mono text-sm font-bold text-red-300">(!) He caught you. Everything costs +50% until he forgives you.</div>
          <p className="mt-1 text-xs text-white/60">Say sorry like you mean it. A real apology, a promise, maybe a word about his fedora. He needs at least two messages, and he won&apos;t listen to more than 6 a day.</p>
          {chat.length > 0 && <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto text-sm">{chat.map((l, i) => (
            <div key={i} className={cn("max-w-[85%] rounded-lg px-2.5 py-1.5", l.from === "me" ? "ml-auto bg-yellow-400/15 text-right" : "bg-white/10")}>{l.from === "seller" && <b className="font-mono text-white/60">Shades: </b>}{l.text}</div>))}</div>}
          <form onSubmit={sayVerySorry} className="mt-2 flex gap-2">
            <input className="input flex-1 !bg-black/40 !text-white" maxLength={300} value={sorry} onChange={(e) => setSorry(e.target.value)} placeholder="Mr. Shades, I'm sorry…" />
            <button className="btn btn-primary" disabled={busy || !sorry.trim()}>{busy ? "…" : "Apologise"}</button>
          </form>
        </div>
      ) : run && !res ? (
        <div className="mt-3 rounded-lg border border-yellow-400/40 bg-black/50 p-3">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="font-mono">DIAL {Math.min(ans.length + 1, run.questions.length)}/{run.questions.length} {"[" + "#".repeat(ans.length) + "-".repeat(run.questions.length - ans.length) + "]"}</span>
            <span className={cn("font-display text-lg tabular-nums", left <= 10 && "animate-pulse text-red-400")}>{left}s</span>
          </div>
          <div className="mt-1 flex gap-1">{run.questions.map((_, i) => <span key={i} className={cn("h-1.5 flex-1 rounded", i < ans.length ? "bg-yellow-400" : "bg-white/15")} />)}</div>
          <AnimatePresence mode="wait">
            {ans.length < run.questions.length && (
              <motion.div key={ans.length} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="mt-3 font-bold">{run.questions[ans.length].prompt}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {run.questions[ans.length].options.map((o, i) => (
                    <button key={i} onClick={() => pick(i)} className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left text-sm hover:border-yellow-400">{o}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {ans.length >= run.questions.length && <p className="mt-3 animate-pulse text-center font-mono font-bold">turning the handle...</p>}
        </div>
      ) : res ? (
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className={cn("relative mt-3 overflow-hidden rounded-lg border-2 p-4 text-center", res.success ? "border-yellow-400 bg-yellow-400/10" : "border-red-500 bg-red-950/50")}>
          {res.success && <Confetti count={120} />}
          <div className="font-mono text-2xl font-bold tracking-widest sm:text-3xl">{res.success ? "*** YOU ESCAPED ***" : "!!! CAUGHT !!!"}</div>
          <p className="mt-1 font-mono text-sm">{res.correct}/3 dials cracked | {res.chance}% odds</p>
          {res.success ? <p className="mt-2 font-mono text-2xl font-bold text-yellow-300">+$ {res.loot.toLocaleString()} <span className="text-base">({res.pct}% of the vault)</span></p>
            : <p className="mt-2 text-sm text-red-200">Mr. Shades grabbed your collar. Prices are +50% for you until he forgives you.</p>}
        </motion.div>
      ) : (
        <div className="mt-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.label} className={cn("rounded-lg border px-3 py-2 text-xs", s.ok ? "border-green-500/50 bg-green-500/10" : "border-white/10 bg-white/5")}>
                <div className="font-mono font-bold">{s.ok ? "[x]" : "[ ]"} {s.label}</div><div className="text-white/60">{s.how}</div>
              </div>
            ))}
          </div>
          {st.owner_online && unlocked && <p className="mt-2 font-mono text-xs font-bold text-red-300">(!) The owner is online: your odds are 20% lower right now.</p>}
          {st.last && <p className="mt-2 text-xs text-white/50">Last heist: {st.last.status === "escaped" ? `escaped with $ ${st.last.loot.toLocaleString()}` : "caught"}</p>}
          <button className="btn btn-accent mt-3 w-full font-mono tracking-wider" disabled={busy || !unlocked || !!st.next_at} onClick={start}>
            {!unlocked ? "[locked] he doesn't trust you yet" : st.next_at ? `Lie low until ${new Date(st.next_at).toLocaleString("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Mauritius" })}` : ">> START THE HEIST"}
          </button>
        </div>
      )}
      {err && <p className="mt-2 text-sm font-bold text-red-300" role="alert">&quot;{err}&quot;</p>}
    </div>
  );
}
