"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Eye, EyeOff, MonitorPlay, Square, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { vizById } from "@/lib/viz";
import type { Viz } from "@/lib/viz/types";
import { ResultBurst, TaskPanel, VizStage, WhyBox, type Result } from "./stage";

export type LiveSession = { id: string; viz: string; step: number; state: Record<string, unknown>; reveal: boolean; status: "live" | "ended"; started_at: string };
export type LiveAnswer = { user_id: string; step: number; answer: unknown; correct: boolean; xp?: number; coins?: number };
type Note = { say: string[]; ask?: string[]; watch?: string };

export function LiveRoom({ initial, meId, meName, role, notes, roster, answers: initialAnswers }: {
  initial: LiveSession; meId: string; meName: string;
  role: "tutor" | "student" | "present";             // present = the tutor's projector view (no notes, no controls)
  notes?: Note[]; roster?: { id: string; name: string }[]; answers: LiveAnswer[];
}) {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const viz = vizById(initial.viz) as Viz;
  const [s, setS] = useState<LiveSession>(initial);
  const [answers, setAnswers] = useState<LiveAnswer[]>(initialAnswers);
  const [online, setOnline] = useState<Record<string, string>>({});
  const [pick, setPick] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(true);
  const tutor = role === "tutor";
  const step = viz.steps[Math.min(s.step, viz.steps.length - 1)];
  const task = step.task;
  const mine = answers.find((a) => a.user_id === meId && a.step === s.step);
  const [result, setResult] = useState<Result>(mine ? { correct: mine.correct, xp: mine.xp, coins: mine.coins, already: true } : null);

  // new step → clear the local pick/result
  const lastStep = useRef(s.step);
  useEffect(() => {
    if (lastStep.current === s.step) return;
    lastStep.current = s.step;
    const m = answers.find((a) => a.user_id === meId && a.step === s.step);
    setPick(task?.kind === "order" ? [] : null);
    setResult(m ? { correct: m.correct, xp: m.xp, coins: m.coins, already: true } : null);
    setErr(null);
    if (!tutor) sfx("round");
  }, [s.step, answers, meId, task, tutor]);

  // realtime: the lesson row (everyone) + answers (tutor sees all, students see their own) + presence
  useEffect(() => {
    const ch = sb.channel(`live-${initial.id}`, { config: { presence: { key: meId } } })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "live_sessions", filter: `id=eq.${initial.id}` }, ({ new: row }) => setS(row as LiveSession))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "live_answers", filter: `session_id=eq.${initial.id}` }, ({ new: row }) => {
        const a = row as LiveAnswer;
        setAnswers((xs) => (xs.some((x) => x.user_id === a.user_id && x.step === a.step) ? xs : [...xs, a]));
        if (tutor) sfx(a.correct ? "lock" : "tick");
      })
      .on("presence", { event: "sync" }, () => {
        const st = ch.presenceState() as Record<string, { name: string; role: string }[]>;
        const o: Record<string, string> = {};
        Object.entries(st).forEach(([k, v]) => { if (v[0]?.role === "student") o[k] = v[0].name; });
        setOnline(o);
      })
      .subscribe((status) => { if (status === "SUBSCRIBED") ch.track({ name: meName, role: role === "student" ? "student" : "tutor" }); });
    return () => { sb.removeChannel(ch); };
  }, [sb, initial.id, meId, meName, role, tutor]);

  // ---- tutor controls
  const call = useCallback(async (fn: string, args: Record<string, unknown>) => {
    const { error } = await sb.rpc(fn, args);
    if (error) setErr(error.message);
  }, [sb]);
  const goto = (n: number) => {
    const to = Math.max(0, Math.min(viz.steps.length - 1, n));
    unlock(); sfx("tick");
    setS((x) => ({ ...x, step: to, reveal: false, state: {} }));
    call("live_goto", { p_session: s.id, p_step: to });
    call("live_set_state", { p_session: s.id, p_state: {} });
  };
  const reveal = (on: boolean) => { setS((x) => ({ ...x, reveal: on })); call("live_reveal", { p_session: s.id, p_on: on }); if (on) sfx("final"); };
  const end = async () => { await call("live_end", { p_session: s.id }); setS((x) => ({ ...x, status: "ended" })); };
  // shared slider: update locally at once, push to everyone at most ~6×/second
  const pending = useRef<Record<string, unknown> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const setShared = useCallback((st: Record<string, unknown>) => {
    setS((x) => ({ ...x, state: st }));
    pending.current = st;
    if (timer.current) return;
    timer.current = setTimeout(() => { timer.current = null; if (pending.current) call("live_set_state", { p_session: initial.id, p_state: pending.current }); }, 160);
  }, [call, initial.id]);

  // ---- student answer
  const submit = async () => {
    if (!task) return;
    setBusy(true); setErr(null);
    const { data, error } = await sb.rpc("live_answer", { p_session: s.id, p_step: s.step, p_answer: pick });
    setBusy(false);
    if (error) { setErr(error.message.includes("moved on") ? "Too slow, the lesson moved on!" : error.message.includes("closed") ? "Answers are closed for this one." : "Couldn't send that, try again."); return; }
    const r = data as { correct: boolean; xp: number; coins: number; already: boolean };
    setResult(r);
    setAnswers((xs) => [...xs, { user_id: meId, step: s.step, answer: pick, correct: r.correct, xp: r.xp, coins: r.coins }]);
  };

  // ---- ended
  if (s.status === "ended") {
    const myRight = answers.filter((a) => a.user_id === meId && a.correct).length;
    const total = viz.steps.filter((x) => x.task).length;
    return (
      <div className="card space-y-3 text-center">
        <div className="text-6xl">{viz.emoji}</div>
        <h2 className="font-display text-3xl">Lesson over!</h2>
        {role === "student" && <p>You got <b>{myRight}/{total}</b> checkpoints right. 🎉</p>}
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/viz/${viz.id}`} className="btn btn-primary">🔁 Replay it yourself</Link>
          <button className="btn btn-ghost" onClick={() => router.push(tutor ? "/tutor/live" : "/dashboard")}>{tutor ? "Back to Live lessons" : "Home"}</button>
        </div>
      </div>
    );
  }

  const stepAnswers = answers.filter((a) => a.step === s.step);
  const people = roster || [];
  const tapCorrect = task?.kind === "tap" && (s.reveal || (result && result.correct)) ? task.answer : null;

  const stage = (
    <VizStage viz={viz} index={s.step} shared={s.state || {}} setShared={tutor ? setShared : undefined}
      tapState={role === "student" ? { picked: (pick as string) ?? null, correct: tapCorrect, onTap: result || s.reveal ? undefined : (t) => setPick(t) } : { correct: s.reveal && task?.kind === "tap" ? task.answer : null }}
      header={<span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-black text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> LIVE</span>}>
      {task && role === "student" && (
        <>
          <TaskPanel task={task} seed={`${viz.id}-${s.step}`} pick={pick ?? (task.kind === "order" ? [] : null)} setPick={setPick} onSubmit={submit} result={result} reveal={s.reveal} busy={busy} />
          <ResultBurst key={s.step} result={result} live />
        </>
      )}
      {task && role !== "student" && <TaskPanel task={task} seed={`${viz.id}-${s.step}`} pick={null} setPick={() => {}} onSubmit={() => {}} result={null} reveal={s.reveal} closed />}
      {s.reveal && <WhyBox text={step.why} />}
      {role === "student" && !task && <p className="text-center text-sm text-muted">👀 Watch and listen. Your tutor will move on when you&apos;re ready.</p>}
      {err && <p className="rounded bg-bad/10 p-2 text-center text-sm font-bold text-bad">{err}</p>}
    </VizStage>
  );

  if (!tutor) return stage;

  // ---- tutor cockpit
  const note = notes?.[s.step];
  const answeredBy = new Map(stepAnswers.map((a) => [a.user_id, a]));
  const rightN = stepAnswers.filter((a) => a.correct).length;
  const dist = task?.kind === "choice" ? task.options.map((_, i) => stepAnswers.filter((a) => a.answer === i).length) : null;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>{stage}</div>
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="card space-y-2 p-3">
          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-ghost" disabled={s.step === 0} onClick={() => goto(s.step - 1)}><ChevronLeft size={18} /> Back</button>
            <button className="btn btn-primary" disabled={s.step >= viz.steps.length - 1} onClick={() => goto(s.step + 1)}>Next <ChevronRight size={18} /></button>
          </div>
          {task && (s.reveal
            ? <button className="btn btn-ghost w-full" onClick={() => reveal(false)}><EyeOff size={16} /> Hide answer (re-open)</button>
            : <button className="btn btn-accent w-full" onClick={() => reveal(true)}><Eye size={16} /> Reveal answer + why</button>)}
          <div className="flex gap-2">
            <a href="/live?present=1" target="_blank" className="btn btn-ghost btn-sm flex-1"><MonitorPlay size={16} /> Projector view</a>
            <button className="btn btn-ghost btn-sm flex-1 text-bad" onClick={end}><Square size={14} /> End lesson</button>
          </div>
          {err && <p className="text-xs text-bad">{err}</p>}
        </div>

        <div className="card space-y-2 p-3">
          <div className="flex items-center justify-between">
            <b className="flex items-center gap-1"><Users size={16} /> Class</b>
            <span className="text-xs text-muted">{Object.keys(online).length} watching{task ? ` · ${stepAnswers.length} answered · ${rightN} right` : ""}</span>
          </div>
          {dist && (
            <div className="space-y-1">
              {task!.kind === "choice" && task!.options.map((o, i) => (
                <div key={o} className="text-xs">
                  <div className="flex justify-between"><span className={cn(i === task!.answer && "font-bold text-good")}>{"ABCDEF"[i]}. {o}</span><span>{dist[i]}</span></div>
                  <div className="h-1.5 rounded bg-surface2"><div className={cn("h-full rounded", i === task!.answer ? "bg-good" : "bg-accent")} style={{ width: `${stepAnswers.length ? (100 * dist[i]) / stepAnswers.length : 0}%` }} /></div>
                </div>
              ))}
            </div>
          )}
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {people.map((p) => {
              const a = answeredBy.get(p.id);
              return (
                <li key={p.id} className="flex items-center gap-2 rounded bg-surface2 px-2 py-1 text-sm">
                  <span className={cn("h-2 w-2 rounded-full", online[p.id] ? "bg-good" : "bg-line")} title={online[p.id] ? "watching" : "not in the lesson"} />
                  <span className="flex-1 truncate">{p.name}</span>
                  {task && (a ? <span className={a.correct ? "text-good" : "text-bad"}>{a.correct ? "✓" : "✗"}</span> : <span className="text-muted">…</span>)}
                </li>
              );
            })}
            {!people.length && <li className="text-xs text-muted">No students for this course yet.</li>}
          </ul>
        </div>

        <div className="card space-y-2 p-3">
          <button className="flex w-full items-center justify-between font-bold" onClick={() => setShowNotes((x) => !x)}>
            <span>🎓 Your teaching notes <span className="text-xs font-normal text-muted">(only you)</span></span>{showNotes ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          {showNotes && note && (
            <div className="space-y-2 text-sm">
              <div><div className="text-xs font-black uppercase text-muted">Say</div><ul className="list-disc pl-5">{note.say.map((x) => <li key={x}>{x}</li>)}</ul></div>
              {note.ask && <div><div className="text-xs font-black uppercase text-muted">Ask</div><ul className="list-disc pl-5">{note.ask.map((x) => <li key={x}>{x}</li>)}</ul></div>}
              {note.watch && <div className="rounded bg-warn/15 p-2 text-xs"><b>⚠️ Watch for:</b> {note.watch}</div>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
