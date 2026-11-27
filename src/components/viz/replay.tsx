"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Confetti } from "@/components/confetti";
import { sfx, unlock } from "@/lib/battle-audio";
import { isRight, type Viz } from "@/lib/viz/types";
import { vizById } from "@/lib/viz";
import { ResultBurst, TaskPanel, VizStage, WhyBox, type Result } from "./stage";

/** Self-paced replay: the student drives. Practice only (live lessons give the XP). */
export function VizReplay({ id, past }: { id: string; past?: { correct: number; total: number; when: string } | null }) {
  const viz = vizById(id) as Viz;
  const [i, setI] = useState(0);
  const [shared, setShared] = useState<Record<string, unknown>>({});
  const [picks, setPicks] = useState<Record<number, unknown>>({});
  const [results, setResults] = useState<Record<number, Result>>({});
  const [finished, setFinished] = useState(false);
  const step = viz.steps[i];
  const task = step.task;
  const res = results[i] ?? null;
  const tasks = viz.steps.map((s, k) => (s.task ? k : -1)).filter((k) => k >= 0);
  const score = tasks.filter((k) => results[k]?.correct).length;

  const go = (n: number) => {
    unlock(); sfx("tick");
    if (n >= viz.steps.length) { setFinished(true); sfx("victory"); return; }
    setI(Math.max(0, n)); setShared({});
  };
  const submit = () => {
    if (!task) return;
    setResults({ ...results, [i]: { correct: isRight(task, picks[i]) } });
  };

  if (finished) return (
    <div className="card space-y-4 text-center">
      {score === tasks.length && <Confetti count={120} />}
      <div className="text-6xl">{viz.emoji}</div>
      <h2 className="font-display text-3xl">{score === tasks.length ? "PERFECT RUN! 🏆" : "Replay complete!"}</h2>
      <p className="text-muted">You got <b className="text-ink">{score}/{tasks.length}</b> checkpoints right.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn btn-primary" onClick={() => { setI(0); setPicks({}); setResults({}); setFinished(false); setShared({}); }}>🔁 Replay</button>
        <Link href={`/courses/${viz.course}/${viz.chapter}`} className="btn btn-ghost">Back to the chapter</Link>
      </div>
      <p className="text-xs text-muted">Replays are for practice. XP comes from live lessons with your tutor.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {past && i === 0 && (
        <div className="rounded-lg border-2 border-line bg-surface2 px-3 py-2 text-sm">📼 In the live lesson ({past.when}) you got <b>{past.correct}/{past.total}</b> right. Can you beat it?</div>
      )}
      <VizStage viz={viz} index={i} shared={shared} setShared={setShared}
        tapState={{ picked: (picks[i] as string) ?? null, correct: res ? (task?.kind === "tap" ? task.answer : null) : null, onTap: res ? undefined : (t) => setPicks({ ...picks, [i]: t }) }}
        header={<span className="chip text-xs">Practice · {score}/{tasks.length}</span>}>
        {task && <TaskPanel task={task} seed={`${viz.id}-${i}`} pick={picks[i] ?? (task.kind === "order" ? [] : null)} setPick={(v) => setPicks({ ...picks, [i]: v })} onSubmit={submit} result={res} reveal={!!res} />}
        <ResultBurst key={i} result={res} />
        {res && <WhyBox text={step.why} />}
      </VizStage>
      <div className="sticky bottom-20 z-10 flex gap-2 lg:bottom-4">
        <button className="btn btn-ghost flex-1" disabled={i === 0} onClick={() => go(i - 1)}><ChevronLeft size={18} /> Back</button>
        <button className="btn btn-primary flex-[2]" disabled={!!task && !res} onClick={() => go(i + 1)}>
          {task && !res ? "Answer to continue" : i === viz.steps.length - 1 ? "Finish 🏁" : <>Next <ChevronRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}
