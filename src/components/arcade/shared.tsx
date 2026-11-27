"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Confetti } from "@/components/confetti";
import { sfx } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";

export type Lesson = { wrong: string; why: string };

/** End screen: win or lose, what you learned from mistakes, and the rewards (sent once to the server). */
export function ResultScreen({ game, success, score, stats, lessons, winText, loseText, onAgain, celebrate }: {
  game: string; success: boolean; score: number; stats: { label: string; value: string }[];
  lessons: Lesson[]; winText: string; loseText: string; onAgain: () => void;
  /** confetti only for a real win (defaults to success); games can turn it off for a scrappy finish */
  celebrate?: boolean;
}) {
  const [reward, setReward] = useState<{ xp: number; coins: number; already_paid_today?: boolean } | null>(null);
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    sfx(success ? "victory" : "defeat");
    createClient().rpc("arcade_finish", { p_game: game, p_score: score, p_success: success })
      .then(({ data }) => setReward((data as never) || { xp: 0, coins: 0 }));
  }, [game, score, success]);
  const uniqueLessons = lessons.filter((l, i, a) => a.findIndex((x) => x.wrong === l.wrong) === i).slice(0, 6);
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card space-y-4 text-center">
      {(celebrate ?? success) && <Confetti count={80} />}
      <motion.div initial={{ scale: 2.2, rotate: -6 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
        className={cn("font-display text-4xl sm:text-5xl", success ? "text-xp" : "text-muted")}>
        {success ? "🏆 MISSION COMPLETE!" : "💀 MISSION FAILED"}
      </motion.div>
      <p className="text-sm text-muted">{success ? winText : loseText}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {stats.map((s) => <div key={s.label} className="chip"><span className="text-muted">{s.label}</span> <b>{s.value}</b></div>)}
      </div>
      <div className="rounded border-2 border-line bg-surface2 p-3 text-sm">
        {!reward ? "Checking rewards…" : reward.xp > 0 ? <span className="font-bold text-good">+{reward.xp} XP · +{reward.coins} coins 🎉</span>
          : success && reward.already_paid_today ? <span>You already got today&apos;s reward for this game. Come back tomorrow for more! 💪</span>
          : success ? <span>Nice win!</span>
          : <span>No XP lost, no coins lost. Losing is free, so try again! 💪</span>}
      </div>
      {uniqueLessons.length > 0 && (
        <div className="text-left">
          <div className="mb-1 text-sm font-bold">📚 What tripped you up</div>
          <ul className="space-y-1 text-sm">
            {uniqueLessons.map((l) => <li key={l.wrong} className="rounded bg-surface2 px-2 py-1"><code className="font-bold text-bad">{l.wrong}</code> <span className="text-muted">→ {l.why}</span></li>)}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn btn-primary" onClick={onAgain}>🔁 Play again</button>
        <Link href="/arcade" className="btn btn-ghost">🕹️ Arcade</Link>
      </div>
    </motion.div>
  );
}

/** Title card before a game starts. */
export function StartScreen({ title, emoji, how, goal, onStart, extra, tips = [] }: { title: string; emoji: string; how: string[]; goal: string; onStart: () => void; extra?: React.ReactNode; tips?: string[] }) {
  return (
    <div className="card space-y-4 text-center">
      <div className="text-6xl">{emoji}</div>
      <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
      <ul className="mx-auto max-w-md space-y-1 text-left text-sm">{how.map((h) => <li key={h}>• {h}</li>)}</ul>
      <div className="rounded border-2 border-xp/60 bg-xp/10 px-3 py-2 text-sm font-bold">🎯 To win: {goal}</div>
      {extra}
      {tips.length > 0 && (
        <details className="rounded border-2 border-accent/50 bg-accent/5 p-2 text-left text-sm" open>
          <summary className="cursor-pointer font-bold">💡 Tips to win</summary>
          <ul className="mt-1 space-y-1">{tips.map((t) => <li key={t}>✔️ {t}</li>)}</ul>
        </details>
      )}
      <button className="btn btn-primary w-full text-lg" onClick={onStart}>▶ START</button>
      <p className="text-xs text-muted">Win = +40 XP and +10 coins (once a day per game). Lose = nothing lost.</p>
    </div>
  );
}

/** Small cheat-sheet shown under a game while playing. */
export function CheatSheet({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg border-2 border-dashed border-line bg-surface2 p-2 text-[11px] sm:text-xs">
      <span className="font-bold">💡</span>
      {items.map((t) => <span key={t} className="rounded bg-surface px-1.5 py-0.5">{t}</span>)}
    </div>
  );
}
