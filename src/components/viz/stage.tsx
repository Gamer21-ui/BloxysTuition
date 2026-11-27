"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Confetti } from "@/components/confetti";
import { sfx } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import type { Task, Viz } from "@/lib/viz/types";
import { SCENES } from "./scenes";

export type Result = { correct: boolean; xp?: number; coins?: number; already?: boolean } | null;

/** Deterministic shuffle so every student sees the same order for a checkpoint. */
function orderView(items: string[], seed: string) {
  const idx = items.map((_, i) => i);
  let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  for (let i = idx.length - 1; i > 0; i--) { h = (h * 1103515245 + 12345) >>> 0; const j = h % (i + 1); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  if (idx.every((v, i) => v === i)) idx.reverse();   // never show it already solved
  return idx;
}

/** The task at a checkpoint: pick → lock in. One try. */
export function TaskPanel({ task, seed, pick, setPick, onSubmit, result, reveal, closed, busy }: {
  task: Task; seed: string; pick: unknown; setPick: (v: unknown) => void; onSubmit: () => void;
  result: Result; reveal: boolean; closed?: boolean; busy?: boolean;
}) {
  const done = !!result || reveal || closed;
  const order = useMemo(() => (task.kind === "order" ? orderView(task.items, seed) : []), [task, seed]);
  const seq = (Array.isArray(pick) ? pick : []) as number[];
  const ready = task.kind === "order" ? seq.length === task.items.length : pick !== null && pick !== undefined;

  return (
    <div className="space-y-2 rounded-xl border-2 border-xp/70 bg-xp/10 p-3">
      <div className="flex items-start gap-2">
        <span className="rounded-full bg-xp px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-black">Your turn</span>
        <div className="font-bold">{task.prompt}</div>
      </div>

      {task.kind === "choice" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {task.options.map((o, i) => {
            const right = (reveal || result) && i === task.answer && (reveal || result?.correct);
            const mine = pick === i;
            return (
              <button key={o} disabled={done} onClick={() => { setPick(i); sfx("tick"); }}
                className={cn("btn h-auto min-h-12 justify-start whitespace-normal border-2 bg-surface py-2 text-left",
                  mine && "border-accent bg-accent/15", right && "!border-good !bg-good/20", done && mine && result && !result.correct && "!border-bad !bg-bad/15")}>
                <span className="mr-2 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface2 text-xs">{"ABCDEF"[i]}</span>{o}
              </button>
            );
          })}
        </div>
      )}

      {task.kind === "order" && (
        <div className="space-y-2">
          <p className="text-xs text-muted">Tap the steps in the right order. Tap a numbered one to undo.</p>
          <div className="grid gap-2">
            {order.map((i) => {
              const pos = seq.indexOf(i);
              return (
                <button key={i} disabled={done} onClick={() => { setPick(pos >= 0 ? seq.slice(0, pos) : [...seq, i]); sfx("tick"); }}
                  className={cn("btn h-auto min-h-11 justify-start whitespace-normal border-2 bg-surface py-2 text-left", pos >= 0 && "border-accent bg-accent/10")}>
                  <span className={cn("mr-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-black", pos >= 0 ? "bg-accent text-white" : "bg-surface2")}>{pos >= 0 ? pos + 1 : "?"}</span>
                  {task.items[i]}
                </button>
              );
            })}
          </div>
          {(reveal || (result && !result.correct)) && reveal && (
            <ol className="list-decimal rounded-lg bg-good/10 p-2 pl-6 text-sm">{task.answer.map((i) => <li key={i}>{task.items[i]}</li>)}</ol>
          )}
        </div>
      )}

      {task.kind === "tap" && (
        <p className="rounded-lg bg-surface px-3 py-2 text-sm font-bold">
          👆 Tap it in the picture above. {pick ? <>You picked <span className="text-accent">{String(pick)}</span>.</> : "Glowing parts can be tapped."}
          {reveal && <> The answer is <span className="text-good">{task.answer}</span>.</>}
        </p>
      )}

      {!done && (
        <button className="btn btn-primary w-full" disabled={!ready || busy} onClick={onSubmit}>{busy ? "Checking…" : "🔒 Lock in my answer"}</button>
      )}
      {closed && !result && !reveal && <p className="text-center text-sm text-muted">Answers are closed for this one.</p>}
    </div>
  );
}

/** Big "correct!" moment. */
const CHEERS = ["🎉 NAILED IT!", "⚡ CORRECT!", "🔥 BIG BRAIN!", "✅ YES!", "🚀 EZ!"];
export function ResultBurst({ result, live }: { result: Result; live?: boolean }) {
  useEffect(() => { if (result) sfx(result.correct ? "correct" : "wrong"); }, [result]);
  const cheer = useMemo(() => CHEERS[Math.floor(Math.random() * CHEERS.length)], [result]);
  if (!result) return null;
  return (
    <>
      {result.correct && !result.already && <Confetti count={90} />}
      <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -4 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}
        className={cn("rounded-xl border-2 p-3 text-center", result.correct ? "border-good bg-good/15" : "border-bad bg-bad/10")}>
        <div className="font-display text-3xl">{result.correct ? cheer : "😅 Not quite"}</div>
        {result.correct && live && (result.xp ? <div className="text-sm font-bold text-good">+{result.xp} XP · +{result.coins} coins</div> : <div className="text-xs text-muted">{result.already ? "Already answered." : "Daily live-lesson XP limit reached, still counts!"}</div>)}
        {!result.correct && live && <div className="text-xs text-muted">Hang tight: your tutor will explain it.</div>}
      </motion.div>
    </>
  );
}

/** Scene + caption + (task) for one step. Used by replays and live lessons. */
export function VizStage({ viz, index, shared, setShared, tapState, children, header }: {
  viz: Viz; index: number; shared: Record<string, unknown>; setShared?: (s: Record<string, unknown>) => void;
  tapState?: { picked?: string | null; correct?: string | null; onTap?: (id: string) => void };
  children?: React.ReactNode; header?: React.ReactNode;
}) {
  const step = viz.steps[index];
  const Scene = SCENES[viz.id];
  const tap = step.task?.kind === "tap" ? { targets: step.task.targets, ...tapState } : undefined;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip text-xs">{viz.emoji} Step {index + 1}/{viz.steps.length}</span>
        <h2 className="font-display text-xl leading-tight sm:text-2xl">{step.title}</h2>
        <div className="ml-auto">{header}</div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface2"><motion.div className="h-full bg-primary" animate={{ width: `${((index + 1) / viz.steps.length) * 100}%` }} /></div>
      <div className="card p-3">{Scene && <Scene scene={step.scene as never} shared={shared} setShared={setShared} sandbox={step.sandbox} tap={tap} />}</div>
      {/* keyed by step so it always shows THIS step's text (no exit animation to get stuck on fast clicks) */}
      <motion.p key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border-2 border-line bg-surface p-3 text-sm leading-relaxed sm:text-base">{step.caption}</motion.p>
      {children}
    </div>
  );
}

export function WhyBox({ text }: { text?: string }) {
  if (!text) return null;
  return <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border-2 border-accent/60 bg-accent/10 p-3 text-sm"><b>💡 Why:</b> {text}</motion.div>;
}

/** Remember picks per step (resets when the step changes). */
export function useStepState<T>(key: string, init: T) {
  const [s, setS] = useState<{ k: string; v: T }>({ k: key, v: init });
  if (s.k !== key) { const fresh = { k: key, v: init }; setS(fresh); return [init, (v: T) => setS({ k: key, v })] as const; }
  return [s.v, (v: T) => setS({ k: key, v })] as const;
}
