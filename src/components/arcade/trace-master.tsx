"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { optionsFor, traceRows, type TraceProgram, type TraceSet } from "@/lib/trace";
import { CheatSheet, ResultScreen, StartScreen, type Lesson } from "./shared";

const PER_RUN = 3;
const LIVES = 5;
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

const CHEATS: Record<string, string[]> = {
  o: ["← means 'becomes'", "DIV(7, 2) = 3", "MOD(7, 2) = 1", "SUBSTRING(s, start, length)", "FOR … NEXT repeats a set number of times"],
  as: ["x MOD 10 = last digit", "x DIV 10 = drop last digit", "MID(s, start, length)", "& joins strings", "STEP -1 counts down"],
  a: ["recursion: calls go down, RETURNs come back up", "Mid ← (Low + High) DIV 2", "stack = last in, first out", "BYREF changes the original"],
  pro: ["Exam tip: only write a value when it CHANGES", "Booleans: TRUE / FALSE", "-1 pointer = end of list", "RIGHT(s, n) = last n chars"],
};

export function TraceMaster({ sets, defaultKey }: { sets: TraceSet[]; defaultKey: string }) {
  const [phase, setPhase] = useState<"start" | "play" | "done">("start");
  const [setKey, setSetKey] = useState(sets.some((s) => s.key === defaultKey) ? defaultKey : sets[0].key);
  const set = sets.find((s) => s.key === setKey)!;
  const [run, setRun] = useState<TraceProgram[]>([]);
  const [pi, setPi] = useState(0);
  const [si, setSi] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [right, setRight] = useState(0);
  const [asked, setAsked] = useState(0);
  const [seed, setSeed] = useState(1);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [feedback, setFeedback] = useState<null | { good: boolean; text: string; pick: string }>(null);
  const [cleared, setCleared] = useState(false);
  const [slips, setSlips] = useState(0);            // mistakes in the program being traced right now
  const [clearedWith, setClearedWith] = useState<{ slips: number; asks: number } | null>(null);
  const [showVb, setShowVb] = useState(false);
  const prog = run[pi];
  const step = prog?.steps[si];

  const begin = () => {
    unlock(); sfx("round");
    setRun(shuffle(set.programs).slice(0, PER_RUN)); setPi(0); setSi(0); setLives(LIVES); setScore(0); setStreak(0);
    setRight(0); setAsked(0); setLessons([]); setFeedback(null); setCleared(false); setSlips(0); setShowVb(false); setSeed(Math.floor(Math.random() * 1000) + 1); setPhase("play");
  };

  // auto-fill steps the player isn't asked about; detect end of each program
  useEffect(() => {
    if (phase !== "play" || !prog || feedback || cleared) return;
    if (si >= prog.steps.length) {
      setCleared(true); setClearedWith({ slips, asks: prog.steps.filter((x) => x.ask).length });
      sfx(slips === 0 ? "final" : "tick");
      const t = setTimeout(() => {
        setCleared(false); setShowVb(false); setSlips(0);
        if (pi + 1 >= run.length) setPhase("done"); else { setPi(pi + 1); setSi(0); sfx("round"); }
      }, slips === 0 ? 1500 : 2600);
      return () => clearTimeout(t);
    }
    if (!step.ask) { const t = setTimeout(() => { setSi((n) => n + 1); sfx("tick"); }, 420); return () => clearTimeout(t); }
  }, [phase, prog, step, si, pi, run.length, feedback, cleared, slips]);

  const options = useMemo(() => (prog && step?.ask ? optionsFor(prog.steps, si, seed + pi * 31) : []), [prog, step, si, seed, pi]);

  const answer = useCallback((v: string) => {
    if (!step || feedback) return;
    setAsked((n) => n + 1);
    const where = step.name;
    if (v === step.value) {
      const s = streak + 1;
      setStreak(s); setRight((n) => n + 1); setScore((x) => x + 100 + Math.min(s, 10) * 15);
      sfx("correct");
      setFeedback({ good: true, text: `✅ ${where} = ${step.value}${step.note ? ` · ${step.note}` : ""}`, pick: v });
      setTimeout(() => { setFeedback(null); setSi((n) => n + 1); }, step.note ? 1300 : 750);
    } else {
      const nl = lives - 1;
      setLives(nl); setStreak(0); setSlips((n) => n + 1); sfx("wrong");
      setFeedback({ good: false, text: `❌ ${where} is ${step.value}, not ${v}.${step.note ? ` ${step.note}.` : ""}`, pick: v });
      setLessons((l) => [...l, { wrong: `${prog.title}, line ${step.line}`, why: `${where} = ${step.value}${step.note ? ` (${step.note})` : ""}` }]);
      if (nl <= 0) setTimeout(() => setPhase("done"), 1600);
    }
  }, [step, feedback, streak, lives, prog]);

  const next = () => { setFeedback(null); setSi((n) => n + 1); };

  if (phase === "start") return (
    <StartScreen title="TRACE MASTER" emoji="🧮" onStart={begin}
      how={[
        "You're the computer now. Read the pseudocode line by line.",
        "Each time a variable changes, pick its new value and fill in the trace table.",
        `Clear ${PER_RUN} programs to win. You have ${LIVES} lives: a wrong value costs one.`,
        "No timer. Take your time and actually trace it, just like in the exam.",
      ]}
      goal={`trace all ${PER_RUN} programs without losing all ${LIVES} lives`}
      extra={(
        <div className="space-y-2 text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Pick your level</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sets.map((s) => (
              <button key={s.key} onClick={() => setSetKey(s.key)}
                className={cn("rounded-lg border-2 p-2 text-left transition", s.key === setKey ? "border-primary bg-primary/10" : "border-line hover:bg-surface2", s.key === "pro" && "border-xp/70")}>
                <div className="font-display text-lg">{s.label}</div>
                <div className="text-xs text-muted">{s.blurb}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      tips={[
        "Put your finger on the highlighted line. Work out ONLY that line.",
        "← means 'becomes': the right side is worked out first using the OLD values.",
        "In a loop, keep track of the counter. FOR i ← 1 TO 3 runs exactly 3 times.",
        "Mistakes cost a life but show you the right value, so read why!",
        "Write the trace on paper too. That's exactly what the exam asks you to do.",
      ]} />
  );

  if (phase === "done") {
    const success = lives > 0; // "done" is reached either by clearing every program or by running out of lives
    return (
      <ResultScreen game={set.game} success={success} score={score} onAgain={() => setPhase("start")} lessons={lessons}
        stats={[{ label: "Level", value: set.label }, { label: "Correct", value: `${right}/${asked}` }, { label: "Score", value: String(score) }, { label: "Lives", value: "❤️".repeat(Math.max(0, lives)) || "0" }]}
        winText={asked - right === 0 ? "Perfect: you ran the code in your head like a real CPU. That's exactly the skill Paper 2 tests."
          : `Finished, but with ${asked - right} mistake${asked - right === 1 ? "" : "s"} (${Math.round((right / Math.max(1, asked)) * 100)}% right first time). Go through the lessons below, then try for a perfect trace.`}
        loseText="Out of lives! Read the lessons below, then trace again. Every attempt makes you faster." />
    );
  }

  if (!prog) return null;
  const shown = prog.steps.slice(0, si);
  const pending = step?.ask && !feedback ? [...shown, { name: step.name, value: "❓" }] : feedback && step ? [...shown, step] : shown;
  const rows = traceRows(prog.vars, pending);
  const hiLine = step ? step.line : prog.steps[prog.steps.length - 1]?.line;
  const lines = showVb && prog.vb ? prog.vb : prog.code;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 font-display">
        <span className="chip">🧮 {pi + 1}/{run.length}</span>
        <span className={cn("chip", streak >= 3 && "text-warn")}>{streak >= 3 ? `🔥 ${streak} streak` : `streak ${streak}`}</span>
        <span className="chip">⭐ {score}</span>
        <span className="chip">{"❤️".repeat(Math.max(0, lives))}{"🖤".repeat(LIVES - Math.max(0, lives))}</span>
      </div>

      <div className="card space-y-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-display text-xl leading-tight">{prog.title}</div>
            <div className="text-xs font-bold text-accent">{prog.topic}</div>
          </div>
          {prog.vb && (
            <div className="flex overflow-hidden rounded border-2 border-line text-xs font-bold">
              <button className={cn("px-2 py-1", !showVb && "bg-primary/20")} onClick={() => setShowVb(false)}>Pseudocode</button>
              <button className={cn("px-2 py-1", showVb && "bg-primary/20")} onClick={() => setShowVb(true)}>VB.NET</button>
            </div>
          )}
        </div>
        <div className="overflow-x-auto rounded-lg bg-slate-950 py-2 font-mono text-[11px] leading-relaxed text-slate-100 sm:text-sm">
          {lines.map((l, k) => {
            const hot = !showVb && k + 1 === hiLine;
            return (
              <div key={k} className={cn("flex px-2", hot && "bg-amber-400/25", l.trim().startsWith("//") || l.trim().startsWith("'") ? "text-slate-400" : "")}>
                <span className={cn("mr-3 inline-block w-5 shrink-0 select-none text-right", hot ? "font-bold text-amber-300" : "text-slate-500")}>{k + 1}</span>
                {/* wrapped lines keep their indent; long lines no longer run off the screen */}
                <span className="min-w-0 flex-1 whitespace-pre-wrap break-words" style={{ paddingLeft: `${(l.match(/^ */)?.[0].length || 0) * 0.55}em`, textIndent: 0 }}>{l.trimStart() || " "}{hot && <span className="ml-2 text-amber-300">◀</span>}</span>
              </div>
            );
          })}
        </div>
        {showVb && <p className="text-xs text-muted">VB.NET version for comparison. Switch back to Pseudocode to see the highlighted line.</p>}
      </div>

      <div className="card overflow-x-auto p-3">
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Trace table</div>
        <table className="w-full min-w-max border-collapse text-center font-mono text-xs sm:text-sm">
          <thead><tr>{prog.vars.map((v) => <th key={v} className="border-2 border-line bg-surface2 px-2 py-1 font-bold">{v}</th>)}</tr></thead>
          <tbody>
            {rows.map((r, k) => (
              <tr key={k}>{r.map((c, j) => (
                <td key={j} className={cn("border-2 border-line px-2 py-1", c === "❓" && "animate-pulse bg-xp/20 font-bold", feedback && k === rows.length - 1 && c === step?.value && prog.vars[j] === step?.name && (feedback.good ? "bg-good/20" : "bg-bad/20"))}>{c}</td>
              ))}</tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={prog.vars.length} className="border-2 border-line px-2 py-2 text-muted">Starting…</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence mode="wait">
        {cleared ? (
          (() => {
            const m = clearedWith?.slips ?? 0, n = clearedWith?.asks ?? 0;
            const grade = m === 0 ? { t: "[OK] PERFECT TRACE", sub: `${n}/${n} right first time`, cls: "border-good bg-good/15" }
              : m <= 2 ? { t: `[~] CLEARED · ${m} MISTAKE${m === 1 ? "" : "S"}`, sub: `${n - m}/${n} right first time. Check the lessons at the end.`, cls: "border-warn bg-warn/15" }
              : { t: `[!] SCRAPED THROUGH · ${m} MISTAKES`, sub: `Only ${Math.max(0, n - m)}/${n} right first time. Trace this one again on paper.`, cls: "border-bad bg-bad/10" };
            return (
              <motion.div key="clear" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
                className={cn("rounded-xl border-2 p-3 text-center", grade.cls)}>
                <div className="font-mono text-lg font-bold tracking-wider sm:text-xl">{grade.t}</div>
                <div className="text-sm text-muted">{grade.sub}</div>
              </motion.div>
            );
          })()
        ) : step?.ask ? (
          <motion.div key={`${pi}-${si}`} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-2">
            <div className="text-center font-bold">
              {step.q ? step.q : <>Line {step.line} runs. {step.name === "OUTPUT" ? "What is OUTPUT?" : <>What is <code className="rounded bg-surface2 px-1">{step.name}</code> now?</>}</>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {options.map((o) => (
                <button key={o} disabled={!!feedback} onClick={() => answer(o)}
                  className={cn("btn h-auto min-h-12 break-all border-2 border-line bg-surface py-2 font-mono text-base hover:bg-surface2",
                    feedback && o === step.value && "border-good bg-good/20",
                    feedback && !feedback.good && o === feedback.pick && "border-bad bg-bad/20")}>{o}</button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="auto" className="text-center text-sm text-muted">⚙️ Running…</motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className={cn("space-y-2 rounded-lg border-2 px-3 py-2 text-sm font-bold", feedback.good ? "border-good bg-good/10" : "border-bad bg-bad/10")}>
            <div>{feedback.text}</div>
            {!feedback.good && lives > 0 && <button className="btn btn-primary w-full" onClick={next}>Got it, keep tracing →</button>}
          </motion.div>
        )}
      </AnimatePresence>
      <CheatSheet items={CHEATS[set.key] || CHEATS.as} />
    </div>
  );
}
