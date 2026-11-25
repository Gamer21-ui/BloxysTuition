"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen, ChevronLeft, ChevronRight, Flame, GraduationCap, Menu, NotebookPen, PartyPopper, ShoppingBag, Swords, Trophy, UserPlus, X, type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

type Step = { icon: LucideIcon; color: string; title: string; body: string[]; href?: string; go?: string };

const STEPS: Step[] = [
  { icon: PartyPopper, color: "bg-primary", title: `Welcome to ${BRAND.short}!`, body: [
    "Revision that plays like a game. This quick tour shows you where everything is. It takes about a minute.",
    "On a phone, everything is in the ☰ menu at the top left, and the main pages are in the bar at the bottom. On a computer, use the sidebar on the left.",
  ] },
  { icon: BookOpen, color: "bg-accent", title: "Courses: notes + quizzes", body: [
    "Each subject is split into chapters. Open a chapter to read the lesson notes for every part, then take the chapter quiz.",
    "Score 50% or more to complete the chapter. Every answer comes with an explanation, so read them when you get one wrong.",
    "New chapters appear as your tutor releases them.",
  ], href: "/courses", go: "Open Courses" },
  { icon: GraduationCap, color: "bg-good", title: "Exam prep", body: [
    "Timed practice papers like the real exam open here when your tutor releases them.",
    "\"Fix my mistakes\" brings back questions you got wrong a few days later, until you've mastered them. Do it whenever it shows a number.",
  ], href: "/practice", go: "Open Exam prep" },
  { icon: NotebookPen, color: "bg-warn", title: "Homework", body: [
    "Worksheets and past papers from your tutor show up here with their due date.",
    "Download the file, do the work, then upload a photo or PDF of your answers. Your marks and feedback come back here too.",
  ], href: "/homework", go: "Open Homework" },
  { icon: Swords, color: "bg-bad", title: "Battles", body: [
    "Live 1v1 or 2v2 quiz fights. Same question for everyone: get it right fast for more points.",
    "Create a lobby and share the 5-letter code, or join someone else's. Use Emotes to talk to the other team, and the 🔊 button to turn the music on or off.",
  ], href: "/battles", go: "Open Battles" },
  { icon: UserPlus, color: "bg-accent", title: "Friends, parties & chat", body: [
    "Add friends, make a party, and your whole party joins battles together on the same team.",
    "Chat is for finding opponents: post your battle code there. Keep it friendly, your tutor can see everything.",
  ], href: "/friends", go: "Open Friends" },
  { icon: Flame, color: "bg-warn", title: "XP, streaks & quests", body: [
    "Quizzes, battles, homework and classes all give XP and coins. Level up to unlock more stuff.",
    "Study every day to keep your 🔥 streak going. Quests give bonus XP for daily and weekly goals.",
  ], href: "/challenges", go: "Open Quests" },
  { icon: ShoppingBag, color: "bg-xp", title: "Shop & your avatar", body: [
    "Spend coins on hats, frames, name styles, titles and more. It's all cosmetic, nobody can buy points.",
    "Customise your avatar and switch themes (including night mode) in your Profile.",
  ], href: "/shop", go: "Open Shop" },
  { icon: Trophy, color: "bg-primary", title: "You're ready!", body: [
    "Check the Leaderboard and Achievements to see how you're doing.",
    "Best first step: open Courses and do your first chapter quiz. Good luck! 💪",
  ], href: "/courses", go: "Start my first quiz" },
];

/**
 * The site tour. Opens by itself when the tutor launches it for everyone (live, no refresh needed),
 * for new students, or when someone presses "Replay tutorial" in their profile.
 */
export function Tutorial({ show, isStudent, seen }: { show: boolean; isStudent: boolean; seen: number }) {
  const sb = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(show);
  const [i, setI] = useState(0);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const replay = () => { setI(0); setOpen(true); };
    window.addEventListener("fb:tutorial", replay);
    if (!isStudent) return () => window.removeEventListener("fb:tutorial", replay);
    const ch = sb.channel("site-settings")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "site_settings" }, ({ new: row }) => {
        if ((row as { tutorial_version?: number }).tutorial_version! > seen) replay();
      })
      .subscribe();
    return () => { window.removeEventListener("fb:tutorial", replay); sb.removeChannel(ch); };
  }, [sb, isStudent, seen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    setOpen(false);
    if (isStudent) sb.rpc("finish_tutorial").then(() => {});
  }

  if (!mounted) return null;
  const s = STEPS[i];
  const last = i === STEPS.length - 1;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Site tour"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="card relative w-full max-w-md" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
            <button onClick={close} className="absolute right-3 top-3 p-1 text-muted hover:text-ink" aria-label="Skip the tour"><X size={20} /></button>
            <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Tour · {i + 1} of {STEPS.length}</div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}>
                <div className={cn("mb-3 grid h-14 w-14 place-items-center rounded-2xl text-white shadow-chunky", s.color)}><s.icon size={28} aria-hidden="true" /></div>
                <h2 className="font-display text-2xl">{s.title}</h2>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">{s.body.map((t, k) => <p key={k}>{t}</p>)}</div>
                {i === 0 && <p className="mt-3 flex items-center gap-2 text-xs font-bold"><Menu size={16} aria-hidden="true" /> Tip: you can replay this tour any time from your Profile.</p>}
              </motion.div>
            </AnimatePresence>
            <div className="mt-5 flex justify-center gap-1.5" aria-hidden="true">
              {STEPS.map((_, k) => <button key={k} tabIndex={-1} onClick={() => setI(k)} className={cn("h-2 rounded-full transition-all", k === i ? "w-6 bg-primary" : "w-2 bg-line")} />)}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button className="btn btn-ghost btn-sm" disabled={i === 0} onClick={() => setI(i - 1)} aria-label="Back"><ChevronLeft size={16} /></button>
              {last ? (
                <Link href={s.href!} className="btn btn-primary btn-sm ml-auto" onClick={close}>{s.go}</Link>
              ) : (
                <button className="btn btn-primary btn-sm ml-auto" onClick={() => setI(i + 1)}>Next <ChevronRight size={16} /></button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** "Replay tutorial" button for the profile page. */
export function ReplayTutorialButton({ className }: { className?: string }) {
  return <button type="button" className={cn("btn btn-ghost", className)} onClick={() => window.dispatchEvent(new Event("fb:tutorial"))}>Replay the site tour</button>;
}
