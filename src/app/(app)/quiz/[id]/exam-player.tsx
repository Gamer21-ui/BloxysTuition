"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Flag, GraduationCap, Sparkles, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Confetti } from "@/components/confetti";
import { cn } from "@/lib/utils";
import { announceLevelUp } from "../../actions";
import { AnswerReview, type ReviewQ, type ReviewResult } from "./answer-review";

type Result = {
  score: number; total: number; time_ms: number; flagged: boolean; xp: number; multiplier: number;
  leveled_up: boolean; level_after: number; review_added?: number; results: ReviewResult[];
};
type Saved = { attempt: string; qs: ReviewQ[]; started: number; answers: Record<string, number>; flags: string[]; away?: number };
const LETTERS = ["A", "B", "C", "D", "E"];
const mmss = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

export function ExamPlayer(props: { quizId: string; title: string; subtitle: string; count: number; timeLimit: number; xpReward: number; color: string; real: boolean; closesAt?: string | null; attemptsLeft?: number | null }) {
  const key = `fb_exam_${props.quizId}`;
  const limitMs = props.timeLimit * 1000;
  const [warn, setWarn] = useState(false);
  const awayNow = useRef(false);
  const [phase, setPhase] = useState<"intro" | "play" | "sending" | "done">("intro");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [resumable, setResumable] = useState<Saved | null>(null);
  const [i, setI] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [res, setRes] = useState<Result | null>(null);
  const [onlyWrong, setOnlyWrong] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const sending = useRef(false);

  // offer to resume an exam that was interrupted by a refresh, if time is left
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem(key) || "null") as Saved | null;
      if (s && Date.now() - s.started < limitMs) setResumable(s); else localStorage.removeItem(key);
    } catch { /* ignore */ }
  }, [key, limitMs]);

  const persist = useCallback((s: Saved) => { setSaved(s); try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* ignore */ } }, [key]);

  const submit = useCallback(async (s: Saved) => {
    if (sending.current) return;
    sending.current = true;
    setPhase("sending"); setConfirm(false);
    const { data, error } = await createClient().rpc("submit_quiz", { p_attempt: s.attempt, p_answers: s.answers, p_focus_lost: s.away || 0 });
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    sending.current = false;
    if (error) { setErr(error.message); setPhase("play"); return; }
    try { localStorage.removeItem(key); } catch { /* ignore */ }
    setRes(data as Result); setPhase("done");
    if ((data as Result).leveled_up) announceLevelUp().catch(() => {});
  }, [key]);

  useEffect(() => {
    if (phase !== "play") return;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  // ends at the time limit, or when the exam closes, whichever comes first
  const deadline = saved ? Math.min(saved.started + limitMs, props.closesAt ? +new Date(props.closesAt) : Infinity) : 0;
  const left = saved ? deadline - now : limitMs;
  useEffect(() => { if (phase === "play" && saved && left <= 0) void submit(saved); }, [phase, saved, left, submit]);

  // focus mode: full screen, and count every time the student leaves the exam screen
  const goFull = () => { try { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); } catch { /* not supported (e.g. iPhone) */ } };
  useEffect(() => {
    if (phase !== "play") return;
    const away = () => {
      if (awayNow.current) return;
      awayNow.current = true;
      setSaved((s) => { if (!s) return s; const n = { ...s, away: (s.away || 0) + 1 }; try { localStorage.setItem(key, JSON.stringify(n)); } catch { /* ignore */ } return n; });
      setWarn(true);
    };
    const back = () => { awayNow.current = false; };
    const onVis = () => (document.hidden ? away() : back());
    const onFs = () => { if (!document.fullscreenElement && document.fullscreenEnabled) away(); else back(); };
    const block = (e: Event) => e.preventDefault();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", away);
    window.addEventListener("focus", back);
    document.addEventListener("fullscreenchange", onFs);
    for (const ev of ["copy", "cut", "paste", "contextmenu"]) document.addEventListener(ev, block);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", away);
      window.removeEventListener("focus", back);
      document.removeEventListener("fullscreenchange", onFs);
      for (const ev of ["copy", "cut", "paste", "contextmenu"]) document.removeEventListener(ev, block);
    };
  }, [phase, key]);

  async function start() {
    goFull();
    setErr(null);
    const { data, error } = await createClient().rpc("start_quiz", { p_quiz: props.quizId });
    if (error) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      const m = error.message;
      return setErr(m.includes("no questions") ? "No chapters are released yet for this subject." : m.includes("no attempts") ? "You have no attempts left for this exam." : m.includes("closed") ? "This exam has closed." : m.includes("locked") ? "This exam is locked. Your tutor will open it." : m);
    }
    persist({ attempt: data.attempt_id, qs: data.questions, started: Date.now(), answers: {}, flags: [] });
    setI(0); setNow(Date.now()); setPhase("play");
  }
  function resume() { if (resumable) { goFull(); setSaved(resumable); setResumable(null); setNow(Date.now()); setPhase("play"); } }

  const back = <Link href="/practice" className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" /> Practice</Link>;

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-xl">
        {back}
        <div className="card mt-4">
          <div className="text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center text-white" style={{ background: props.color, borderRadius: "var(--radius)" }}><GraduationCap size={32} aria-hidden="true" /></div>
            <h1 className="mt-4 text-3xl">{props.title}</h1>
            <p className="mt-1 text-muted">{props.subtitle}</p>
          </div>
          <ul className="mt-5 space-y-1.5 text-sm">
            <li>📝 <b>{props.count} questions</b> drawn at random from every chapter released so far.</li>
            <li>⏱️ <b>{Math.round(props.timeLimit / 60)} minutes.</b> It submits itself when time runs out.</li>
            <li>🔁 Move between questions, change answers and flag ones to come back to.</li>
            <li>🤫 No feedback until the end, just like the real thing.</li>
            <li>📚 Anything you get wrong goes into your mistakes deck.</li>
            <li>✨ Up to {props.xpReward} XP{props.attemptsLeft == null ? " for your first 2 attempts each day" : ""}.</li>
            {props.attemptsLeft != null && <li>🎯 <b>{props.attemptsLeft} attempt{props.attemptsLeft === 1 ? "" : "s"} left.</b> Starting uses one.</li>}
            {props.closesAt && <li>📅 Closes {new Date(props.closesAt).toLocaleString("en-GB", { timeZone: "Indian/Mauritius", dateStyle: "medium", timeStyle: "short" })}. Unfinished work is submitted then.</li>}
            <li>🖥️ <b>Focus mode:</b> the exam goes full screen. Leaving it (switching tab or app) is counted and shown to your tutor.</li>
          </ul>
          {!props.real && <p className="mt-3 rounded border-2 border-line bg-surface2 p-2 text-xs text-muted">This subject has no multiple-choice paper in the real exam. This is a timed mixed-topic test to check your knowledge across the syllabus.</p>}
          {err && <p className="mt-3 font-bold text-bad">{err}</p>}
          {resumable ? (
            <div className="mt-6 grid gap-2">
              <button onClick={resume} className="btn btn-primary w-full text-lg">Resume ({mmss(limitMs - (Date.now() - resumable.started))} left)</button>
              <button onClick={() => { localStorage.removeItem(key); setResumable(null); void start(); }} className="btn btn-ghost w-full">Start a new one instead</button>
            </div>
          ) : <button onClick={start} className="btn btn-primary mt-6 w-full text-lg">Start exam</button>}
        </div>
      </div>
    );
  }

  if (phase === "done" && res && saved) {
    const pct = Math.round((res.score / res.total) * 100);
    return (
      <div className="mx-auto max-w-2xl">
        {res.leveled_up && <Confetti />}
        {back}
        <div className="card mt-4 text-center">
          {res.leveled_up && <div className="mb-2 font-display text-2xl text-xp">LEVEL UP! Lv {res.level_after}</div>}
          <div className="text-sm font-bold uppercase text-muted">{props.title}</div>
          <div className="mt-2 font-display text-6xl" style={{ color: pct >= 50 ? "rgb(var(--good))" : "rgb(var(--bad))" }}>{pct}%</div>
          <div className="mt-1 text-muted">{res.score} out of {res.total} · {mmss(res.time_ms)} used of {Math.round(props.timeLimit / 60)}:00</div>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <span className="chip text-base text-xp"><Sparkles size={16} aria-hidden="true" /> +{res.xp} XP</span>
            {Number(res.multiplier) > 1 && <span className="chip text-base text-accent"><Zap size={16} aria-hidden="true" /> {Number(res.multiplier)}× boost</span>}
          </div>
          {res.flagged && <p className="mt-3 text-sm font-bold text-warn">Submitted too fast or too late, so no XP this time.</p>}
          {!!res.review_added && <p className="mt-3 text-sm">{res.review_added} question{res.review_added === 1 ? "" : "s"} added to your <Link className="underline" href="/practice">mistakes deck</Link>. Fix them over the next week.</p>}
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/practice" className="btn btn-primary">See my progress</Link>
          </div>
        </div>
        <div className="mb-3 mt-8 flex items-center justify-between">
          <h2 className="text-2xl">Review</h2>
          <button className="btn btn-ghost btn-sm" onClick={() => setOnlyWrong((x) => !x)}>{onlyWrong ? "Show all questions" : "Show only mistakes"}</button>
        </div>
        <AnswerReview qs={saved.qs} results={res.results} onlyWrong={onlyWrong} />
      </div>
    );
  }

  if (!saved) return null;
  const q = saved.qs[i];
  const answered = Object.keys(saved.answers).length;
  const unanswered = saved.qs.length - answered;
  const flagged = saved.flags.includes(q.id);
  const pick = (oi: number) => {
    const a = { ...saved.answers };
    if (a[q.id] === oi) delete a[q.id]; else a[q.id] = oi; // tap again to clear
    persist({ ...saved, answers: a });
  };
  const toggleFlag = () => persist({ ...saved, flags: flagged ? saved.flags.filter((x) => x !== q.id) : [...saved.flags, q.id] });

  return (
    <div className="mx-auto max-w-3xl select-none">
      {warn && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4" role="alertdialog" aria-modal="true">
          <div className="card max-w-sm text-center">
            <div className="text-4xl">👀</div>
            <h2 className="mt-2 text-xl">You left the exam screen</h2>
            <p className="mt-1 text-sm text-muted">That&apos;s {saved.away || 1} time{(saved.away || 1) === 1 ? "" : "s"} so far. Your tutor can see this count. Your timer kept running.</p>
            <button className="btn btn-primary mt-4" onClick={() => { setWarn(false); goFull(); }}>Back to the exam</button>
          </div>
        </div>
      )}
      <div className="sticky top-0 z-10 -mx-2 mb-4 flex items-center gap-3 bg-bg/90 px-2 py-2 backdrop-blur">
        <span className="font-bold">{props.title.split(" (")[0]}</span>
        <span className="text-sm text-muted">{answered}/{saved.qs.length} answered</span>
        <span className={cn("chip ml-auto font-display text-lg tabular-nums", left < 300_000 && "text-bad", left < 60_000 && "animate-pulse")}>
          <Clock size={16} aria-hidden="true" /> {mmss(left)}
        </span>
      </div>

      <div className="card">
        <div className="flex items-center justify-between text-sm font-bold text-muted">
          <span>Question {i + 1} of {saved.qs.length}</span>
          <button onClick={toggleFlag} className={cn("chip", flagged && "bg-warn text-white")} aria-pressed={flagged}><Flag size={14} aria-hidden="true" /> {flagged ? "Flagged" : "Flag for later"}</button>
        </div>
        <h1 className="mt-3 text-xl leading-snug md:text-2xl">{q.prompt}</h1>
        <div className="mt-5 grid gap-2.5">
          {q.options.map((o, oi) => (
            <button key={oi} onClick={() => pick(oi)} disabled={phase === "sending"}
              className={cn("flex items-center gap-3 border-2 border-line bg-surface2 p-3 text-left transition hover:border-accent", saved.answers[q.id] === oi && "border-accent bg-accent/15 ring-2 ring-accent")}
              style={{ borderRadius: "calc(var(--radius)*.6)" }}>
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center border-2 border-line font-display", saved.answers[q.id] === oi && "bg-accent text-white")} style={{ borderRadius: "calc(var(--radius)*.5)" }}>{LETTERS[oi]}</span>
              {o}
            </button>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-2">
          <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => setI(i - 1)}><ChevronLeft size={16} aria-hidden="true" /> Previous</button>
          {i + 1 < saved.qs.length
            ? <button className="btn btn-primary btn-sm" onClick={() => setI(i + 1)}>Next <ChevronRight size={16} aria-hidden="true" /></button>
            : <button className="btn btn-primary btn-sm" onClick={() => setConfirm(true)}>Finish</button>}
        </div>
      </div>

      <div className="card mt-4">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm bg-accent" /> answered</span>
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm bg-warn" /> flagged</span>
          <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-sm border-2 border-line" /> not answered</span>
        </div>
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {saved.qs.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} aria-label={`Question ${k + 1}`}
              className={cn("h-9 border-2 border-line text-sm font-bold tabular-nums",
                saved.flags.includes(x.id) ? "border-warn bg-warn text-white" : saved.answers[x.id] !== undefined ? "border-accent bg-accent text-white" : "bg-surface2",
                k === i && "ring-2 ring-ink ring-offset-1")}
              style={{ borderRadius: 6 }}>{k + 1}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm mt-3 w-full" onClick={() => setConfirm(true)}>Finish and submit</button>
      </div>

      {confirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="card max-w-sm text-center">
            <h2 className="text-xl">Submit your exam?</h2>
            <p className="mt-2 text-sm text-muted">
              {unanswered ? <><b className="text-bad">{unanswered} unanswered</b> question{unanswered === 1 ? "" : "s"} will be marked wrong. </> : "All questions answered. "}
              {saved.flags.length > 0 && <>{saved.flags.length} still flagged. </>}
              You can't change answers after this.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Keep going</button>
              <button className="btn btn-primary" disabled={phase === "sending"} onClick={() => submit(saved)}>{phase === "sending" ? "Marking…" : "Submit"}</button>
            </div>
          </div>
        </div>
      )}
      {err && <p className="mt-3 font-bold text-bad">{err}</p>}
    </div>
  );
}
