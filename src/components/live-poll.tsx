"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Check, Minus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sfx } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";

export type Poll = { id: string; question: string; options: string[]; counts: number[]; correct: number | null; status: "open" | "closed"; created_at: string };

/** Result bars. `mine` is highlighted; the correct answer is marked once the poll is closed. */
export function PollBars({ poll, mine, onPick, showResults }: { poll: Poll; mine?: number | null; onPick?: (i: number) => void; showResults: boolean }) {
  const total = poll.counts.reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      {poll.options.map((o, i) => {
        const pct = total ? Math.round((100 * poll.counts[i]) / total) : 0;
        const right = poll.status === "closed" && poll.correct === i;
        const wrongPick = poll.status === "closed" && poll.correct !== null && mine === i && poll.correct !== i;
        return (
          <button key={i} type="button" disabled={!onPick || poll.status !== "open"} onClick={() => onPick?.(i)}
            className={cn("relative block w-full overflow-hidden rounded border-2 border-line bg-surface2 px-3 py-2.5 text-left font-bold transition",
              onPick && poll.status === "open" && "hover:border-primary", mine === i && "border-accent", right && "border-good", wrongPick && "border-bad")}>
            {showResults && <motion.span className={cn("absolute inset-y-0 left-0", right ? "bg-good/25" : mine === i ? "bg-accent/25" : "bg-primary/15")}
              initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />}
            <span className="relative flex items-center gap-2">
              {right ? <Check size={16} className="text-good" /> : mine === i ? <span className="h-2.5 w-2.5 rounded-full bg-accent" /> : null}
              <span className="flex-1">{o}</span>
              {showResults && <span className="tabular-nums text-sm">{pct}% <span className="font-normal text-muted">({poll.counts[i]})</span></span>}
            </span>
          </button>
        );
      })}
      {showResults && <p className="text-right text-xs text-muted">{total} vote{total === 1 ? "" : "s"}{poll.status === "open" ? " · live" : " · closed"}</p>}
    </div>
  );
}

/** Students: pops up whenever the tutor launches a poll, results update live after voting. */
export function LivePoll({ meId }: { meId: string }) {
  const sb = useMemo(() => createClient(), []);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [mine, setMine] = useState<number | null>(null);
  const [view, setView] = useState<"open" | "min" | "hidden">("hidden");
  const [err, setErr] = useState<string | null>(null);
  const current = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await sb.from("polls").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!alive || !data) return;
      const { data: v } = await sb.from("poll_votes").select("choice").eq("poll_id", data.id).eq("user_id", meId).maybeSingle();
      current.current = data.id; setPoll(data as Poll); setMine(v?.choice ?? null); setView(v ? "min" : "open");
    })();
    const ch = sb.channel("polls-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "polls" }, ({ new: row }) => {
        const p = row as Poll; if (p.status !== "open") return;
        current.current = p.id; setPoll(p); setMine(null); setErr(null); setView("open"); sfx("join");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "polls" }, ({ new: row }) => {
        const p = row as Poll; if (p.id !== current.current) return;
        setPoll(p);
        if (p.status === "closed") setView((v) => (v === "hidden" ? "hidden" : "open"));
      })
      .subscribe();
    return () => { alive = false; sb.removeChannel(ch); };
  }, [sb, meId]);

  async function vote(i: number) {
    if (!poll) return;
    setErr(null); setMine(i);
    const { error } = await sb.rpc("vote_poll", { p_poll: poll.id, p_choice: i });
    if (error) setErr(error.message.includes("closed") ? "This poll just closed." : "Couldn't send your vote, try again.");
  }

  if (!poll || view === "hidden") return null;
  if (view === "min") return (
    <button onClick={() => setView("open")} className="btn btn-accent fixed bottom-24 right-4 z-40 shadow-chunky lg:bottom-6">
      <BarChart3 size={16} /> {poll.status === "open" ? "Live poll" : "Poll results"}
    </button>
  );
  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[55] grid place-items-center bg-black/50 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="dialog" aria-modal="true" aria-label="Live poll">
        <motion.div className="card relative w-full max-w-md" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}>
          <div className="absolute right-2 top-2 flex">
            {poll.status === "open" && <button onClick={() => setView("min")} className="p-1.5 text-muted hover:text-ink" aria-label="Minimise"><Minus size={18} /></button>}
            <button onClick={() => setView(poll.status === "open" ? "min" : "hidden")} className="p-1.5 text-muted hover:text-ink" aria-label="Close"><X size={18} /></button>
          </div>
          <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            {poll.status === "open" ? <><span className="h-2 w-2 animate-pulse rounded-full bg-bad" /> Live poll</> : <span className="text-muted">Poll closed</span>}
          </div>
          <h2 className="mb-4 pr-14 font-display text-xl">{poll.question}</h2>
          <PollBars poll={poll} mine={mine} onPick={vote} showResults={mine !== null || poll.status === "closed"} />
          {mine === null && poll.status === "open" && <p className="mt-2 text-center text-xs text-muted">Tap an answer. Results show after you vote.</p>}
          {mine !== null && poll.status === "open" && <p className="mt-2 text-center text-xs text-muted">Vote sent ✔ You can change it until your tutor closes the poll.</p>}
          {err && <p className="mt-2 text-center text-sm font-bold text-bad">{err}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
