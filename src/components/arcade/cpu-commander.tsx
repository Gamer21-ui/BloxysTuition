"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { CheatSheet, ResultScreen, StartScreen, type Lesson } from "./shared";

type Op = "LOAD" | "ADD" | "SUB" | "OUT" | "MUL";
type Card = { id: string; op: Op; n?: number };
type Level = { title: string; tip: string; target: number[]; palette: Card[]; solution: string[] };

const SET: { op: Op; does: string }[] = [
  { op: "LOAD", does: "put a number into the ACC" },
  { op: "ADD", does: "add a number to the ACC" },
  { op: "SUB", does: "subtract a number from the ACC" },
  { op: "OUT", does: "output what's in the ACC" },
];
const c = (id: string, op: Op, n?: number): Card => ({ id, op, n });
const LEVELS: Level[] = [
  { title: "Boot up", tip: "LOAD puts a number in the accumulator (ACC). OUT shows it.", target: [7], palette: [c("a", "LOAD", 3), c("b", "LOAD", 7), c("c", "OUT")], solution: ["LOAD 7", "OUT"] },
  { title: "First sum", tip: "The CPU runs instructions in order, one per fetch–decode–execute cycle.", target: [12], palette: [c("a", "LOAD", 5), c("b", "ADD", 2), c("c", "ADD", 7), c("d", "OUT")], solution: ["LOAD 5", "ADD 7", "OUT"] },
  { title: "Combo", tip: "You don't have to use every card.", target: [10], palette: [c("a", "LOAD", 3), c("b", "ADD", 4), c("c", "SUB", 1), c("d", "ADD", 3), c("e", "OUT")], solution: ["LOAD 3", "ADD 4", "ADD 3", "OUT"] },
  { title: "Back to zero", tip: "SUB takes away from the ACC.", target: [0], palette: [c("a", "LOAD", 9), c("b", "SUB", 4), c("c", "ADD", 2), c("d", "SUB", 5), c("e", "OUT")], solution: ["LOAD 9", "SUB 4", "SUB 5", "OUT"] },
  { title: "Times table?", tip: "Hmm… there's a MUL card here. Is MUL in this CPU's instruction set? 🤔", target: [16], palette: [c("a", "LOAD", 4), c("m", "MUL", 4), c("b", "ADD", 4), c("x", "ADD", 4), c("y", "ADD", 4), c("d", "OUT")], solution: ["LOAD 4", "ADD 4", "ADD 4", "ADD 4", "OUT"] },
  { title: "Double output", tip: "A program can OUT more than once. Output 5, then 8.", target: [5, 8], palette: [c("a", "LOAD", 5), c("b", "OUT"), c("s", "SUB", 3), c("d", "ADD", 3), c("e", "OUT")], solution: ["LOAD 5", "OUT", "ADD 3", "OUT"] },
];
const label = (k: Card) => (k.n === undefined ? k.op : `${k.op} ${k.n}`);
const MAX_SLOTS = 6;
type Stage = "FETCH" | "DECODE" | "EXECUTE" | null;

export function CpuCommander() {
  const [phase, setPhase] = useState<"start" | "play" | "done">("start");
  const [lv, setLv] = useState(0);
  const [prog, setProg] = useState<Card[]>([]);
  const [running, setRunning] = useState(false);
  const [pc, setPc] = useState(0);
  const [cur, setCur] = useState(-1); // RAM address being worked on
  const [stage, setStage] = useState<Stage>(null);
  const [acc, setAcc] = useState<number | null>(null);   // empty until something is LOADed
  const [cir, setCir] = useState("");
  const [out, setOut] = useState<number[]>([]);
  const [msg, setMsg] = useState<{ t: string; good?: boolean; boom?: boolean } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [runs, setRuns] = useState(0);
  const [won, setWon] = useState(false);
  const [hint, setHint] = useState(0); // how many steps of the solution are revealed
  const L = LEVELS[lv];

  const reset = () => { setPc(0); setCur(-1); setStage(null); setAcc(null); setCir(""); setOut([]); setMsg(null); };
  const begin = () => { unlock(); setLv(0); setProg([]); setHint(0); reset(); setLessons([]); setRuns(0); setPhase("play"); sfx("round"); };
  const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

  async function run() {
    if (!prog.length || running) return;
    setRunning(true); reset(); setRuns((n) => n + 1);
    let a: number | null = null; const outs: number[] = [];
    for (let i = 0; i < prog.length; i++) {
      const k = prog[i];
      setPc(i); setCur(i); setStage("FETCH"); setCir(""); sfx("tick"); await wait(300);
      setCir(label(k)); setPc(i + 1); await wait(240);   // fetched into CIR, and PC already points at the NEXT instruction
      setStage("DECODE"); await wait(420);
      if (k.op === "MUL") {
        setStage(null); sfx("wrong");
        setMsg({ t: `❓ UNKNOWN INSTRUCTION "MUL": it's not in this CPU's instruction set, so the CPU can't decode it. Multiply using ADDs instead!`, boom: true });
        setLessons((l) => [...l, { wrong: "MUL 4", why: "not in the instruction set: a CPU can only run commands from its own instruction set (4 × 4 = LOAD 4 + ADD 4 + ADD 4 + ADD 4)" }]);
        setRunning(false); return;
      }
      if (k.op !== "LOAD" && a === null) {
        // nothing was ever LOADed, so there's no value in the ACC to add to, subtract from or output
        setStage(null); sfx("wrong");
        const why = `${label(k)} ran but the ACC was empty: nothing had been LOADed yet. A program has to LOAD a starting value first.`;
        setMsg({ t: `❌ ${why}`, boom: true });
        setLessons((l) => [...l, { wrong: prog.map(label).join(" → "), why }]);
        setRunning(false); return;
      }
      setStage("EXECUTE");
      if (k.op === "LOAD") a = k.n!; else if (k.op === "ADD") a = a! + k.n!; else if (k.op === "SUB") a = a! - k.n!; else { outs.push(a!); setOut([...outs]); sfx("lock"); }
      setAcc(a); await wait(480);
    }
    setStage(null); setCur(-1);
    const ok = outs.length === L.target.length && outs.every((v, i) => v === L.target[i]);
    if (ok) {
      sfx("correct");
      if (lv === LEVELS.length - 1) { setMsg({ t: "🏆 All programs run perfectly!", good: true }); await wait(1100); setWon(true); setPhase("done"); }
      else { setMsg({ t: `✅ Output ${outs.join(", ")}: level complete!`, good: true }); }
    } else {
      sfx("wrong");
      const why = !outs.length ? "Your program never used OUT, so nothing was output." : `You output ${outs.join(", ")} but the target was ${L.target.join(", ")}.`;
      setMsg({ t: `❌ ${why} Change your program and run it again.` });
      setLessons((l) => [...l, { wrong: prog.map(label).join(" → "), why }]);
    }
    setRunning(false);
  }
  const next = () => { setLv((n) => n + 1); setProg([]); setHint(0); reset(); };
  const used = new Set(prog.map((p) => p.id));
  const solved = msg?.good && !running;

  if (phase === "start") return (
    <StartScreen title="CPU COMMANDER" emoji="🤖" onStart={begin}
      how={[
        "You're programming a tiny CPU. Tap cards to build a program, then hit ▶ RUN.",
        "Watch the CPU fetch, decode and execute each instruction. The PC goes up by 1 during each fetch, and the ACC (accumulator) holds the result.",
        "Get the OUTPUT to match the target to clear the level. Retries are free!",
      ]}
      goal={`clear all ${LEVELS.length} levels`}
      tips={[
        "Almost every program starts with LOAD, to put a starting number in the ACC.",
        "Always finish with OUT, or nothing gets output!",
        "Work it out on paper first: start number, then +/− each step, then check it equals the target.",
        "If a command isn't in the instruction set, the CPU can't run it. Find another way with the commands it DOES know.",
        "Stuck? Press 💡 Hint to reveal the program one step at a time. No penalty!",
      ]}
      extra={<div className="rounded bg-surface2 p-2 text-left text-xs"><b>🧠 Key idea:</b> an <b>instruction set</b> is the list of machine-code commands a CPU understands. This CPU only knows <b>LOAD, ADD, SUB and OUT</b>. Anything else, it can&apos;t run.</div>} />
  );
  if (phase === "done") return (
    <ResultScreen game="cpu-commander" success={won} score={won ? 600 : lv * 100} onAgain={() => { setWon(false); setPhase("start"); }} lessons={lessons}
      stats={[{ label: "Levels", value: `${won ? LEVELS.length : lv}/${LEVELS.length}` }, { label: "Runs", value: String(runs) }]}
      winText="You programmed a CPU using only its instruction set, even multiplying with ADDs. That's real low-level thinking!"
      loseText={`You cleared ${lv} of ${LEVELS.length} levels. Come back and finish the job, commander.`} />
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-xs font-bold uppercase tracking-wider text-muted">Level {lv + 1} / {LEVELS.length}</div><div className="font-display text-2xl">{L.title}</div></div>
        <div className="rounded-lg border-2 border-xp bg-xp/10 px-3 py-1 font-display text-lg">🎯 Target: {L.target.join(" then ")}</div>
      </div>
      <p className="text-sm text-muted">💡 {L.tip}</p>
      <CheatSheet items={["start with LOAD", "end with OUT", "ACC = running total", "PC = next address", "only LOAD · ADD · SUB · OUT"]} />
      {hint > 0 && (
        <div className="rounded-lg border-2 border-accent/50 bg-accent/5 p-2 text-sm">
          <b>💡 Hint:</b> {L.solution.slice(0, hint).map((x, i) => <code key={i} className="mx-0.5 rounded bg-surface px-1.5 py-0.5 font-bold">{i}: {x}</code>)}
          {hint < L.solution.length && <span className="text-muted"> …</span>}
        </div>
      )}

      {/* cards + controls first, so phones don't have to scroll to play */}
      <div className="card p-3">
        <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Your cards (tap to add to the program)</div>
        <div className="flex flex-wrap gap-2">
          {L.palette.map((k) => (
            <button key={k.id} type="button" disabled={running || used.has(k.id) || prog.length >= MAX_SLOTS}
              onClick={() => { setProg([...prog, k]); setMsg(null); sfx("emote"); }}
              className={cn("rounded-lg border-2 px-3 py-2 font-mono font-bold shadow-chunky transition disabled:opacity-30",
                k.op === "MUL" ? "border-warn bg-warn/15" : "border-accent bg-accent/10")}>{label(k)}</button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {msg && <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
          className={cn("rounded-lg border-2 p-3 text-sm font-bold", msg.good ? "border-good bg-good/10" : "border-bad bg-bad/10")}>{msg.t}</motion.div>}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        {solved && lv < LEVELS.length - 1
          ? <button className="btn btn-primary flex-1" onClick={next}>Next level ➜</button>
          : <button className="btn btn-primary flex-1" disabled={running || !prog.length} onClick={run}>{running ? "Running…" : "▶ RUN"}</button>}
        <button className="btn btn-ghost" disabled={running || hint >= L.solution.length} onClick={() => setHint((h) => h + 1)}>💡 Hint</button>
        <button className="btn btn-ghost" disabled={running} onClick={() => { setProg([]); reset(); }}>Clear</button>
        <button className="btn btn-ghost" disabled={running} onClick={() => { setWon(false); setPhase("done"); }}>Give up</button>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_1.2fr_0.8fr]">
        {/* RAM: the program */}
        <div className="card p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">RAM: your program</div>
          <div className="space-y-1.5">
            {Array.from({ length: MAX_SLOTS }, (_, i) => {
              const k = prog[i];
              return (
                <button key={i} type="button" disabled={running || !k} onClick={() => setProg(prog.filter((_, j) => j !== i))}
                  className={cn("flex w-full items-center gap-2 rounded border-2 px-2 py-1.5 font-mono text-sm transition",
                    running && cur === i ? "border-xp bg-xp/20" : "border-line", k ? "bg-surface2" : "border-dashed opacity-50")}>
                  <span className="w-6 text-xs text-muted">{i}</span>
                  <span className={cn("flex-1 text-left font-bold", k?.op === "MUL" && "text-warn")}>{k ? label(k) : "empty"}</span>
                  {k && !running && <span className="text-xs text-muted">✕</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* CPU */}
        <motion.div className={cn("card relative overflow-hidden p-3", msg?.boom && "border-bad")} animate={msg?.boom ? { x: [0, -6, 6, -3, 0] } : {}}>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">CPU</div>
          <div className="mb-3 flex gap-1.5">
            {(["FETCH", "DECODE", "EXECUTE"] as Stage[]).map((s) => (
              <div key={s} className={cn("flex-1 rounded px-1 py-1 text-center text-[10px] font-bold transition sm:text-xs", stage === s ? "bg-primary text-primary-ink shadow-chunky" : "bg-surface2 text-muted")}>{s}</div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[{ k: "PC", v: String(pc), hint: "address of NEXT instruction" }, { k: "CIR", v: cir || "—", hint: "current instruction" }, { k: "ACC", v: acc === null ? "—" : String(acc), hint: "result" }].map((r) => (
              <div key={r.k} className="rounded-lg border-2 border-line bg-surface2 p-2">
                <div className="text-xs font-bold text-muted">{r.k}</div>
                <motion.div key={r.v} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-mono text-lg font-bold">{r.v}</motion.div>
                <div className="text-[10px] text-muted">{r.hint}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-lg bg-surface2 p-2 text-xs">
            <div className="mb-1 font-bold">📖 Instruction set (all this CPU understands):</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">{SET.map((s) => <div key={s.op}><code className="font-bold">{s.op}</code> <span className="text-muted">{s.does}</span></div>)}</div>
          </div>
          <AnimatePresence>
            {msg?.boom && <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 0.9 }} className="pointer-events-none absolute inset-0 bg-bad" />}
          </AnimatePresence>
        </motion.div>

        {/* output */}
        <div className="card p-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">Output</div>
          <div className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-lg bg-black p-2 font-mono text-3xl text-green-400 shadow-inner">
            {out.length ? out.map((o, i) => <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }}>{o}</motion.div>) : <span className="text-sm text-green-900">_</span>}
          </div>
        </div>
      </div>

    </div>
  );
}
