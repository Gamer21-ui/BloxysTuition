"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * "What's new" note shown once per update when someone opens the app again.
 * Bump UPDATE_ID and edit CHANGES for the next one. Seen-state is kept on the device.
 */
const UPDATE_ID = "2026-11-28";
const CHANGES: { title: string; text: string }[] = [
  { title: "Past-paper Duels", text: "1v1 on a chapter with exam-style questions. After each one you see how to score it in the real paper. Open now for CS Hardware and Software." },
  { title: "Order Race 1v1", text: "In the Arcade: put the steps in order (PC > MAR > MDR > CIR and more). Fastest correct order wins. Challenge people from chat." },
  { title: "Bounties", text: "Win 3 battles in a row and you're Wanted. End someone's streak for bonus XP and up to 250 coins per 5 wins. Check Most Wanted on Battles." },
  { title: "Live lessons", text: "Some classes now run live on the site: follow along, answer checkpoints, then replay the lesson later." },
  { title: "Fairer questions", text: "535 quiz and battle questions rewritten: no more guessing by picking the longest answer." },
  { title: "Fixes from your feedback", text: "Smoother emotes, clearer recursion in Trace Master, honest results, CPU Commander fix, cleaner friends list, and the phone bars now match your theme." },
];

export function WhatsNew({ skip = false }: { skip?: boolean }) {
  const [open, setOpen] = useState(false);
  const key = `fb_seen_update_${UPDATE_ID}`;
  useEffect(() => {
    try {
      if (localStorage.getItem(key)) return;
      if (skip) { localStorage.setItem(key, "1"); return; }   // brand-new students get the site tour instead
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    } catch { /* storage blocked: just don't show it */ }
  }, [key, skip]);
  const close = () => { setOpen(false); try { localStorage.setItem(key, "1"); } catch { /* ignore */ } };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close} role="dialog" aria-modal="true" aria-labelledby="whats-new-title">
          <motion.div className="card max-h-[85dvh] w-full max-w-lg overflow-y-auto p-5" initial={{ y: 24, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-muted">[ update · 28 Nov ]</div>
            <h2 id="whats-new-title" className="mt-1 font-display text-2xl">A big thank you</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Thank you for your commitment to learning with me. You&apos;re giving up part of your holidays to get a head start on next year, and that takes real discipline.
              I&apos;ll do the best on my part to help you succeed.
            </p>
            <div className="mt-4 font-mono text-xs font-bold uppercase tracking-wider text-muted">What&apos;s new</div>
            <ul className="mt-2 space-y-2">
              {CHANGES.map((c) => (
                <li key={c.title} className="flex gap-2 text-sm">
                  <span className="font-mono font-bold text-accent">&gt;</span>
                  <span><b>{c.title}.</b> <span className="text-muted">{c.text}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">Keep going. See you in class.<br /><span className="font-bold">FunnyBloxy, your tutor</span></p>
            <button className="btn btn-primary mt-4 w-full" onClick={close}>Let&apos;s go</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
