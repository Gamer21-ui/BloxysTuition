"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ShadySeller } from "@/components/shady-seller";
import { cn } from "@/lib/utils";

type Status = { owner_online: boolean; uses: { bunk: number; skip: number }; max_uses: number; prices: Record<"bunk" | "skip", { coins: number; xp: number }> };
type Opt = { id: string; label: string };

const GOODS = {
  bunk: { name: "Bunk Card", emoji: "🃏", blurb: "Turns one absence from the last 30 days into 'excused'. Nobody needs to know.", empty: "You haven't missed any classes lately. Respect." },
  skip: { name: "Skip Homework Pass", emoji: "📜", blurb: "One piece of homework disappears from your list. Poof.", empty: "No homework to skip. Suspiciously responsible of you." },
} as const;
type Good = keyof typeof GOODS;

const GREETINGS = [
  "Psst… kid. Over here. Don't tell the owner about this place.",
  "You didn't see me. I didn't see you. Capisce?",
  "Prices are… non-negotiable. Quality goods, though.",
  "The owner doesn't know about this place. Let's keep it that way.",
];

export function BlackMarket({ isTutor, ready, status, coins, xp, homework, absences }: {
  isTutor: boolean; ready: boolean; status: Status | null; coins: number; xp: number; homework: Opt[]; absences: Opt[];
}) {
  const router = useRouter();
  const greet = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);
  const [pick, setPick] = useState<Good | null>(null);
  const [target, setTarget] = useState("");
  const [line, setLine] = useState(greet);
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState(false);

  if (isTutor) return (
    <Shell>
      <ShadySeller size={170} />
      <p className="mt-4 font-display text-2xl">&quot;…the OWNER?! I— I was never here. 💨&quot;</p>
      <p className="mt-2 text-sm text-white/60">The seller doesn&apos;t deal with you. Students who find this place can buy a Bunk Card or a Skip Homework Pass for a huge price in coins <i>and</i> XP, 3 times max each.
        If you&apos;re online when they do, there&apos;s a 50% chance you get a notification. Every deal is also logged in the <code>black_market_log</code> table in Supabase.</p>
      <Link href="/shop" className="btn btn-ghost mt-4">Back to the shop</Link>
    </Shell>
  );
  if (!ready || !status) return <Shell><ShadySeller size={170} /><p className="mt-4 text-white/70">&quot;Come back later, kid. Shop&apos;s not open yet.&quot;</p><Link href="/shop" className="btn btn-ghost mt-4">Leave</Link></Shell>;

  async function deal() {
    if (!pick || !target) return;
    setBusy(true); setBad(false);
    const { data, error } = await createClient().rpc("black_market_buy", { p_item: pick, p_target: target });
    setBusy(false);
    if (error) { setBad(true); setLine(`"${error.message.charAt(0).toUpperCase() + error.message.slice(1)}."`); return; }
    const r = data as { uses_left: number; caught: boolean };
    setLine(r.caught ? "\"…did you hear that? I think someone saw us. I'm outta here. 👀\""
      : r.uses_left === 0 ? "\"That's the last one I'll ever sell you. It's broken now. Don't come back.\""
      : "\"Pleasure doing business. You never saw me.\"");
    setPick(null); setTarget("");
    router.refresh();
  }

  return (
    <Shell>
      {status.owner_online && <div className="mb-3 rounded border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300">👀 The owner is ONLINE right now. Risky…</div>}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0" onMouseEnter={() => setPick((p) => p)}><ShadySeller open={!!pick} size={170} /></div>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={cn("relative rounded-xl border px-4 py-3 font-bold", bad ? "border-red-500/40 bg-red-950/40" : "border-white/15 bg-white/5")}>
              {line.startsWith("\"") ? line : `"${line}"`}
            </motion.div>
          </AnimatePresence>
          <div className="mt-2 text-xs text-white/50">You have 🪙 {coins.toLocaleString()} coins · {xp.toLocaleString()} XP</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(Object.keys(GOODS) as Good[]).map((g) => {
          const used = status.uses[g]; const broken = used >= status.max_uses; const price = status.prices[g];
          const opts = g === "bunk" ? absences : homework;
          const afford = coins >= price.coins && xp >= price.xp;
          return (
            <button key={g} type="button" disabled={broken} onClick={() => { setPick(g); setTarget(""); setBad(false); setLine(broken ? "" : `"${GOODS[g].name}? Good choice. Pick your poison."`); }}
              className={cn("rounded-xl border p-4 text-left transition", pick === g ? "border-yellow-400 bg-yellow-400/10" : "border-white/15 bg-white/5 hover:border-white/40",
                broken && "cursor-not-allowed opacity-50 grayscale")}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-3xl">{broken ? "💥" : GOODS[g].emoji}</span>
                <span className="flex gap-1" title={`${status.max_uses - used} left`}>
                  {Array.from({ length: status.max_uses }, (_, i) => <span key={i} className={cn("h-2.5 w-2.5 rounded-full", i < status.max_uses - used ? "bg-yellow-400" : "bg-white/15")} />)}
                </span>
              </div>
              <div className="mt-2 font-display text-lg">{GOODS[g].name}{broken && " · BROKEN"}</div>
              <div className="text-xs text-white/60">{broken ? "You've used all 3. The seller won't sell you another." : GOODS[g].blurb}</div>
              <div className={cn("mt-2 text-sm font-bold", afford ? "text-yellow-300" : "text-red-400")}>🪙 {price.coins.toLocaleString()} + ✨ {price.xp.toLocaleString()} XP</div>
              {!broken && !opts.length && <div className="mt-1 text-xs text-white/40">{GOODS[g].empty}</div>}
            </button>
          );
        })}
      </div>

      {pick && (
        <div className="mt-4 space-y-3 rounded-xl border border-white/15 bg-white/5 p-4">
          <label className="block text-sm font-bold">{pick === "bunk" ? "Which absence disappears?" : "Which homework disappears?"}
            <select className="input mt-1" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Choose…</option>
              {(pick === "bunk" ? absences : homework).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <p className="text-xs text-white/50">Costs 🪙 {status.prices[pick].coins.toLocaleString()} coins and ✨ {status.prices[pick].xp.toLocaleString()} XP. Losing XP can drop your level and your place on the leaderboards. No refunds.</p>
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={!target || busy} onClick={deal}>{busy ? "…" : "🤝 Deal"}</button>
            <button className="btn btn-ghost" onClick={() => { setPick(null); setLine("\"Cold feet? Smart. Maybe.\""); }}>Walk away</button>
          </div>
        </div>
      )}
      <div className="mt-8 text-center"><Link href="/shop" className="inline-block px-3 py-2.5 text-xs text-white/40 hover:text-white/80">← sneak back to the normal shop</Link></div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 p-5 text-center text-white shadow-2xl sm:p-6 sm:text-left"
      style={{ background: "radial-gradient(circle at 30% 0%, #2a1f3d 0%, #0b0b10 55%, #050507 100%)" }}>
      <div className="mb-4 flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40 sm:text-xs sm:tracking-[0.3em]"><span className="whitespace-nowrap">🕳️ black market</span><span className="whitespace-nowrap">no refunds</span></div>
      {children}
    </div>
  );
}
