"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Clock, RotateCcw, Sparkles, Timer, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Confetti } from "@/components/confetti";
import { announceLevelUp } from "../../actions";

type Q = { id: string; prompt: string; options: string[] };
type Result = {
  score: number; total: number; points: number; time_ms: number; flagged: boolean; xp: number; multiplier: number;
  leveled_up: boolean; level_after: number;
  results: { id: string; choice: number | null; correct: number; right: boolean; explanation: string | null }[];
};

const LETTERS = ["A", "B", "C", "D", "E"];

export function QuizPlayer(props: {
  quizId: string; title: string; subtitle: string; kind: string; xpReward: number; timeLimit: number | null; backHref: string; color: string;
}) {
  const speed = props.kind === "speedrun";
  const [phase, setPhase] = useState<"intro" | "play" | "sending" | "done">("intro");
  const [attempt, setAttempt] = useState<string | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setElapsed(Date.now() - startRef.current), 200);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "play" && speed && props.timeLimit && elapsed > props.timeLimit * 1000) void submit(answers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed]);

  async function start() {
    setErr(null);
    const { data, error } = await createClient().rpc("start_quiz", { p_quiz: props.quizId });
    if (error) return setErr(error.message.includes("locked") ? "This quiz is locked." : error.message);
    setAttempt(data.attempt_id);
    setQs(data.questions);
    setAnswers({});
    setI(0);
    setPicked(null);
    setRes(null);
    startRef.current = Date.now();
    setElapsed(0);
    setPhase("play");
  }

  async function submit(final: Record<string, number>) {
    if (!attempt || phase === "sending") return;
    setPhase("sending");
    const { data, error } = await createClient().rpc("submit_quiz", { p_attempt: attempt, p_answers: final });
    if (error) { setErr(error.message); setPhase("play"); return; }
    setRes(data as Result);
    setPhase("done");
    if ((data as Result).leveled_up) announceLevelUp().catch(() => {});
  }

  function next(choice: number) {
    const q = qs[i];
    const nextAnswers = { ...answers, [q.id]: choice };
    setAnswers(nextAnswers);
    setPicked(null);
    if (i + 1 >= qs.length) void submit(nextAnswers);
    else setI(i + 1);
  }

  const back = (
    <Link href={props.backHref} className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink">
      <ArrowLeft size={16} aria-hidden="true" /> Back
    </Link>
  );

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-xl">
        {back}
        <div className="card mt-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center text-white" style={{ background: props.color, borderRadius: "var(--radius)" }}>
            {speed ? <Timer size={32} aria-hidden="true" /> : <Sparkles size={32} aria-hidden="true" />}
          </div>
          <h1 className="mt-4 text-3xl">{props.title}</h1>
          <p className="mt-1 text-muted">{props.subtitle}</p>
          <p className="mt-4 text-sm">
            {speed
              ? `Up to 10 questions${props.timeLimit ? ` in ${props.timeLimit}s` : ""}. Points for every right answer, plus a speed bonus. XP for your first 3 runs each day.`
              : `Earn up to ${props.xpReward} XP. Retakes only pay for beating your best score, so take your time.`}
          </p>
          {err && <p className="mt-3 font-bold text-bad">{err}</p>}
          <button onClick={start} className="btn btn-primary mt-6 w-full text-lg">{speed ? "Go!" : "Start quiz"}</button>
        </div>
      </div>
    );
  }

  if (phase === "done" && res) {
    const pct = Math.round((res.score / res.total) * 100);
    return (
      <div className="mx-auto max-w-2xl">
        {res.leveled_up && <Confetti />}
        {back}
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card mt-4 text-center">
          {res.leveled_up && <div className="mb-2 font-display text-2xl text-xp">LEVEL UP! Lv {res.level_after}</div>}
          <div className="font-display text-6xl" style={{ color: pct >= 50 ? "rgb(var(--good))" : "rgb(var(--bad))" }}>{res.score}/{res.total}</div>
          <div className="mt-1 text-muted">{pct >= 80 ? "Insane run." : pct >= 50 ? "Passed. Nice work." : "Not this time. Review and retry."}</div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <span className="chip text-base text-xp"><Sparkles size={16} aria-hidden="true" /> +{res.xp} XP</span>
            {Number(res.multiplier) > 1 && <span className="chip text-base text-accent"><Zap size={16} aria-hidden="true" /> {Number(res.multiplier)}× level-jump boost</span>}
            {speed && <span className="chip text-base"><Timer size={16} aria-hidden="true" /> {res.points} pts · {(res.time_ms / 1000).toFixed(1)}s</span>}
          </div>
          {res.flagged && <p className="mt-3 text-sm font-bold text-warn">That was suspiciously fast, so no XP this time. Read the questions properly 😉</p>}
          {!res.flagged && res.xp === 0 && !speed && <p className="mt-3 text-sm text-muted">No XP: beat your best score to earn more.</p>}
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={start} className="btn btn-primary"><RotateCcw size={18} aria-hidden="true" /> Again</button>
            <Link href={speed ? "/leaderboard?kind=speedrun" : props.backHref} className="btn btn-ghost">{speed ? "Leaderboard" : "Done"}</Link>
          </div>
        </motion.div>

        <h2 className="mb-3 mt-8 text-2xl">Review</h2>
        <div className="space-y-3">
          {qs.map((q, k) => {
            const r = res.results.find((x) => x.id === q.id);
            return (
              <div key={q.id} className="card">
                <div className="flex gap-2">
                  {r?.right ? <Check className="shrink-0 text-good" aria-label="Correct" /> : <X className="shrink-0 text-bad" aria-label="Wrong" />}
                  <div className="font-bold">{k + 1}. {q.prompt}</div>
                </div>
                <div className="mt-2 grid gap-1.5 text-sm">
                  {q.options.map((o, oi) => (
                    <div key={oi} className={`px-3 py-1.5 border-2 ${oi === r?.correct ? "border-good bg-good/10" : oi === r?.choice ? "border-bad bg-bad/10" : "border-transparent"}`} style={{ borderRadius: "calc(var(--radius)*.5)" }}>
                      {LETTERS[oi]}. {o}
                    </div>
                  ))}
                </div>
                {r?.explanation && <p className="mt-2 text-sm text-muted">💡 {r.explanation}</p>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = qs[i];
  const limitMs = (props.timeLimit || 0) * 1000;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={props.backHref} aria-label="Quit quiz" className="text-muted hover:text-ink"><X /></Link>
        <div className="bar h-4 flex-1"><i style={{ width: `${(i / qs.length) * 100}%`, background: "rgb(var(--primary))", transition: "width .3s" }} /></div>
        <span className="chip">
          <Clock size={14} aria-hidden="true" />
          {speed && limitMs ? `${Math.max(0, Math.ceil((limitMs - elapsed) / 1000))}s` : `${Math.floor(elapsed / 1000)}s`}
        </span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q?.id} initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }} transition={{ duration: 0.18 }} className="mt-8">
          <div className="text-sm font-bold text-muted">Question {i + 1} of {qs.length}</div>
          <h1 className="mt-2 text-2xl leading-snug md:text-3xl">{q?.prompt}</h1>
          <div className="mt-6 grid gap-3">
            {q?.options.map((o, oi) => (
              <button
                key={oi}
                onClick={() => (speed ? next(oi) : setPicked(oi))}
                disabled={phase === "sending"}
                className={`card flex items-center gap-3 text-left text-lg transition hover:-translate-y-0.5 ${picked === oi ? "ring-4 ring-accent" : ""}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center border-2 border-line bg-surface2 font-display" style={{ borderRadius: "calc(var(--radius)*.5)" }}>{LETTERS[oi]}</span>
                {o}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      {!speed && (
        <div className="sticky bottom-20 mt-6 lg:bottom-4">
          <button onClick={() => picked !== null && next(picked)} disabled={picked === null || phase === "sending"} className="btn btn-primary w-full text-lg">
            {phase === "sending" ? "Marking…" : i + 1 === qs.length ? "Finish" : "Next"}
          </button>
        </div>
      )}
      {err && <p className="mt-3 font-bold text-bad">{err}</p>}
    </div>
  );
}
