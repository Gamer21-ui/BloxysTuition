"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ShadySeller } from "@/components/shady-seller";
import { cn } from "@/lib/utils";
import { haggleSay, haggleShake, haggleWalk } from "./haggle-actions";

type Status = { owner_online: boolean; uses: { bunk: number; skip: number }; max_uses: number; prices: Record<"bunk" | "skip", { coins: number; xp: number }> };
type Opt = { id: string; label: string };

const GOODS = {
  bunk: { name: "Bunk Card", emoji: "🃏", blurb: "Turns one absence from the last 30 days into 'excused': it stops counting against your attendance %, and still counts for attendance quests & achievements. Nobody needs to know.", empty: "You haven't missed any classes lately. Respect." },
  skip: { name: "Skip Homework Pass", emoji: "📜", blurb: "One piece of homework disappears from your list. Poof.", empty: "No homework to skip. Suspiciously responsible of you." },
} as const;
type Good = keyof typeof GOODS;

const GREETINGS = [
  "Psst… kid. Over here. Don't tell the owner about this place.",
  "You didn't see me. I didn't see you. Capisce?",
  "Prices are… negotiable. If you can talk.",
  "The owner doesn't know about this place. Let's keep it that way.",
];
const TIERS = [0, 15, 25, 50];
type Haggle = { id: string | null; lines: { from: "me" | "seller"; text: string }[]; discount: number; turnsLeft: number; deal: boolean };
const NO_HAGGLE: Haggle = { id: null, lines: [], discount: 0, turnsLeft: 5, deal: false };

type Shades = { mood: string; hello: string; cap: number; capReason: string | null; tax?: number; visits?: number; overdue?: number } | null;
export function BlackMarket({ isTutor, ready, status, coins, xp, homework, absences, shades = null }: {
  isTutor: boolean; ready: boolean; status: Status | null; coins: number; xp: number; homework: Opt[]; absences: Opt[]; shades?: Shades;
}) {
  const router = useRouter();
  const greet = useMemo(() => shades?.hello || GREETINGS[Math.floor(Math.random() * GREETINGS.length)], [shades]);
  const [pick, setPick] = useState<Good | null>(null);
  const [target, setTarget] = useState("");
  const [line, setLine] = useState(greet);
  const [busy, setBusy] = useState(false);
  const [bad, setBad] = useState(false);
  const [hag, setHag] = useState<Haggle>(NO_HAGGLE);
  const [msg, setMsg] = useState("");
  const [talking, setTalking] = useState(false);

  if (isTutor) return (
    <Shell>
      <ShadySeller size={170} />
      <p className="mt-4 font-display text-2xl">&quot;…the OWNER?! I— I was never here. 💨&quot;</p>
      <p className="mt-2 text-sm text-white/60">The seller doesn&apos;t deal with you. Students who find this place can buy a Bunk Card or a Skip Homework Pass for coins <i>and</i> XP, 3 times max each, and can haggle with him (up to 50% off for great negotiating).
        If you&apos;re online when they do, there&apos;s a 50% chance you get a notification. Every deal is also logged in the <code>black_market_log</code> table in Supabase.</p>
      <Link href="/shop" className="btn btn-ghost mt-4">Back to the shop</Link>
    </Shell>
  );
  if (!ready || !status) return <Shell><ShadySeller size={170} /><p className="mt-4 text-white/70">&quot;Come back later, kid. Shop&apos;s not open yet.&quot;</p><Link href="/shop" className="btn btn-ghost mt-4">Leave</Link></Shell>;

  async function deal() {
    if (!pick || !target) return;
    setBusy(true); setBad(false);
    const { data, error } = await createClient().rpc("black_market_buy", hag.deal && hag.id
      ? { p_item: pick, p_target: target, p_haggle: hag.id } : { p_item: pick, p_target: target });
    setBusy(false);
    if (error) { setBad(true); setLine(`"${error.message.charAt(0).toUpperCase() + error.message.slice(1)}."`); return; }
    const r = data as { uses_left: number; caught: boolean };
    setLine(r.caught ? "\"…did you hear that? I think someone saw us. I'm outta here. 👀\""
      : r.uses_left === 0 ? "\"That's the last one I'll ever sell you. It's broken now. Don't come back.\""
      : "\"Pleasure doing business. You never saw me.\"");
    setPick(null); setTarget(""); setHag(NO_HAGGLE);
    router.refresh();
  }

  async function say() {
    if (!pick || !msg.trim() || talking) return;
    const text = msg.trim();
    setMsg(""); setTalking(true); setBad(false);
    setHag((h) => ({ ...h, lines: [...h.lines, { from: "me", text }] }));
    const r = await haggleSay({ id: hag.id, item: pick, text });
    setTalking(false);
    if (!r.ok) { setBad(true); setLine(r.error.startsWith("\"") ? r.error : `"${r.error}"`); setHag((h) => ({ ...h, lines: h.lines.slice(0, -1) })); return; }
    setLine(`"${r.reply}"`);
    setHag((h) => ({ ...h, id: r.id, discount: r.discount, turnsLeft: r.turnsLeft, lines: [...h.lines, { from: "seller", text: r.reply }] }));
  }
  async function shake() {
    if (!hag.id) return;
    const r = await haggleShake(hag.id);
    if (!r.ok) { setBad(true); setLine(r.error.startsWith("\"") ? r.error : `"${r.error}"`); return; }
    setHag((h) => ({ ...h, deal: true }));
    setLine(`"${r.discount}% off. Shake fast, the deal melts in 15 minutes. 🤝"`);
  }
  const reset = () => { if (hag.id && !hag.deal) haggleWalk(hag.id); setHag(NO_HAGGLE); setMsg(""); };

  return (
    <Shell>
      {status.owner_online && <div className="mb-3 rounded border border-red-500/50 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-300">👀 The owner is ONLINE. Mr. Shades says: &quot;Don&apos;t buy now, kid. 50/50 they see it. Come back later.&quot;</div>}
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="shrink-0" onMouseEnter={() => setPick((p) => p)}><ShadySeller open={!!pick} talking={talking} size={170} /></div>
        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div key={line} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={cn("relative rounded-xl border px-4 py-3 font-bold", bad ? "border-red-500/40 bg-red-950/40" : "border-white/15 bg-white/5")}>
              {line.startsWith("\"") ? line : `"${line}"`}
            </motion.div>
          </AnimatePresence>
          {!!shades?.tax && (
            <div className="mt-2 rounded-lg border border-orange-400/50 bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-200">
              🧾 Loiterer tax: +{shades.tax}% on everything. {shades.visits} visits this week with {shades.overdue} overdue homework. Hand it in and the tax disappears.
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs text-white/50 sm:justify-start">
            <span className="font-bold text-white/80">🕶️ Mr. Shades</span>
            {shades && <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">Mood: {shades.mood}</span>}
            {!!shades?.visits && <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5">👣 Visit #{shades.visits} this week</span>}
            <span>You have 🪙 {coins.toLocaleString()} coins · {xp.toLocaleString()} XP</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(Object.keys(GOODS) as Good[]).map((g) => {
          const used = status.uses[g]; const broken = used >= status.max_uses; const tax = shades?.tax || 0;
          const price = { coins: Math.round(status.prices[g].coins * (100 + tax) / 100), xp: Math.round(status.prices[g].xp * (100 + tax) / 100) };
          const opts = g === "bunk" ? absences : homework;
          const afford = coins >= price.coins && xp >= price.xp;
          return (
            <button key={g} type="button" disabled={broken} onClick={() => { if (pick !== g) reset(); setPick(g); setTarget(""); setBad(false); setLine(broken ? "" : `"${GOODS[g].name}? Good choice. Think you can talk me down?"`); }}
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
              <div className={cn("mt-2 text-sm font-bold", afford ? "text-yellow-300" : "text-red-400")}>🪙 {price.coins.toLocaleString()} + ✨ {price.xp.toLocaleString()} XP{tax ? <span className="ml-1 text-orange-300">(+{tax}% tax)</span> : null}</div>
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
          {/* ---- haggling */}
          <div className="rounded-lg border border-yellow-400/30 bg-black/30 p-3">
            <div className="flex items-center justify-between gap-2 text-sm font-bold">
              <span>🤝 Haggle with him</span>
              <span className="text-xs font-normal text-white/50">{hag.deal ? "deal locked for 15 min" : `${hag.turnsLeft} message${hag.turnsLeft === 1 ? "" : "s"} left`}</span>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px] font-bold">
              {TIERS.map((t) => (
                <div key={t} className={cn("rounded px-1 py-1 transition", shades && t > shades.cap ? "bg-white/5 text-white/20 line-through" : hag.discount === t ? (t ? "bg-yellow-400 text-black" : "bg-white/20") : hag.discount > t ? "bg-yellow-400/25 text-yellow-200" : "bg-white/5 text-white/40")}>{t ? `-${t}%` : "full price"}{shades && t > shades.cap ? " 🔒" : ""}</div>
              ))}
            </div>
            {shades?.capReason && <p className="mt-1 text-[11px] text-yellow-200/80">🔒 Max {shades.cap}% for you: {shades.capReason}. Big shots pay big.</p>}
            {hag.lines.length > 0 && (
              <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto pr-1 text-sm">
                {hag.lines.map((l, i) => (
                  <div key={i} className={cn("max-w-[85%] rounded-lg px-2.5 py-1.5", l.from === "me" ? "ml-auto bg-yellow-400/15 text-right" : "bg-white/10")}>{l.from === "seller" ? "🕶️ " : ""}{l.text}</div>
                ))}
                {talking && <div className="w-16 rounded-lg bg-white/10 px-2.5 py-1.5 text-center"><span className="animate-pulse">• • •</span></div>}
              </div>
            )}
            {!hag.deal && hag.turnsLeft > 0 && (
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); say(); }}>
                <input className="input flex-1 !bg-black/40 !text-white" maxLength={300} value={msg} onChange={(e) => setMsg(e.target.value)}
                  placeholder={hag.lines.length ? "Keep talking…" : "Talk him down…"} />
                <button className="btn btn-primary" disabled={!msg.trim() || talking}>Say</button>
              </form>
            )}
            {!hag.deal && hag.discount > 0 && <button className="btn btn-accent mt-2 w-full" onClick={shake}>🤝 Shake on {hag.discount}% off</button>}
            <p className="mt-2 text-[11px] text-white/40">How you talk matters. Effort, charm and good arguments get bigger discounts (15%, 25%, even 50%). Rude or tricky? Full price.</p>
          </div>

          {(() => {
            const tax = shades?.tax || 0, off = hag.deal ? hag.discount : 0;
            const base = { coins: Math.round(status.prices[pick].coins * (100 + tax) / 100), xp: Math.round(status.prices[pick].xp * (100 + tax) / 100) };
            const c = Math.round(Math.round(status.prices[pick].coins * (100 - off) / 100) * (100 + tax) / 100), x = Math.round(Math.round(status.prices[pick].xp * (100 - off) / 100) * (100 + tax) / 100);
            return (
              <p className="text-xs text-white/50">
                Costs {off > 0 && <s className="mr-1 text-white/30">🪙 {base.coins.toLocaleString()} + {base.xp.toLocaleString()} XP</s>}
                <b className={off ? "text-yellow-300" : ""}>🪙 {c.toLocaleString()} coins and ✨ {x.toLocaleString()} XP</b>{off > 0 && ` (${off}% off!)`}. Losing XP can drop your level and your place on the leaderboards. No refunds.
              </p>
            );
          })()}
          <div className="flex gap-2">
            <button className="btn btn-primary" disabled={!target || busy} onClick={deal}>{busy ? "…" : hag.deal ? `🤝 Deal (-${hag.discount}%)` : "🤝 Deal"}</button>
            <button className="btn btn-ghost" onClick={() => { reset(); setPick(null); setLine("\"Cold feet? Smart. Maybe.\""); }}>Walk away</button>
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
