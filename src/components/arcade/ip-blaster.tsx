"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { ResultScreen, StartScreen, type Lesson } from "./shared";

type Mode = "v4" | "v6";
type Target = { id: number; text: string; valid: boolean; why: string; x: number; y: number; born: number; ttl: number; dx: number };
type Fx = { id: number; x: number; y: number; text: string; good: boolean };

const GAME_SECONDS = 45;
const WIN_HITS = 12;
const WIN_ACC = 0.75;

const r = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[r(a.length)];
const hex = (len: number) => Array.from({ length: len }, () => "0123456789abcdef"[r(16)]).join("");

// ---------------------------------------------------------------- address factories
function validV4() {
  const style = r(3);
  if (style === 0) return `192.168.${r(256)}.${1 + r(254)}`;
  if (style === 1) return `10.${r(256)}.${r(256)}.${1 + r(254)}`;
  return `${1 + r(223)}.${r(256)}.${r(256)}.${1 + r(254)}`;
}
function validV6() {
  const groups = Array.from({ length: 8 }, (_, i) => (i === 0 ? pick(["2001", "fe80", "2a02", "2400"]) : hex(1 + r(4))));
  return groups.join(":");
}
const mac = () => Array.from({ length: 6 }, () => hex(2).toUpperCase()).join(":");

function badV4(): { text: string; why: string } {
  switch (r(6)) {
    case 0: { const o = [r(256), r(256), r(256), r(256)]; o[r(4)] = 256 + r(144); return { text: o.join("."), why: `${Math.max(...o)} is too big: each IPv4 number is 0–255 (8 bits)` }; }
    case 1: return { text: `${r(256)}.${r(256)}.${r(256)}`, why: "only 3 numbers: IPv4 has exactly 4" };
    case 2: return { text: `${r(256)}.${r(256)}.${r(256)}.${r(256)}.${r(256)}`, why: "5 numbers: IPv4 has exactly 4" };
    case 3: return { text: mac(), why: "that's a MAC address (6 pairs of hex), not an IP address" };
    case 4: return { text: validV6().split(":").slice(0, 8).join(":"), why: "that's IPv6 (hex + colons). We want IPv4!" };
    default: return { text: `192.168.${pick(["A", "x", "1a"])}.${r(256)}`, why: "IPv4 only uses denary numbers 0–255, no letters" };
  }
}
function badV6(): { text: string; why: string } {
  switch (r(5)) {
    case 0: return { text: validV4(), why: "that's IPv4 (32-bit, denary numbers). We want IPv6!" };
    case 1: return { text: mac(), why: "that's a MAC address: 6 pairs (48 bits). IPv6 has 8 groups (128 bits)" };
    case 2: { const g = validV6().split(":"); g[1 + r(7)] = pick(["g7a2", "zz10", "k3", "0x9q"]); return { text: g.join(":"), why: "hex only uses 0–9 and A–F, there's no G, K, Q or Z!" }; }
    case 3: return { text: validV6() + ":" + hex(4), why: "9 groups: IPv6 has exactly 8 groups" };
    default: return { text: validV6().split(":").slice(0, 6).join(":"), why: "only 6 groups: IPv6 has exactly 8 groups (8 × 16 bits = 128)" };
  }
}
function makeTarget(mode: Mode, id: number, elapsed: number, others: Target[] = []): Target {
  const valid = Math.random() < 0.55;
  const bad = mode === "v4" ? badV4() : badV6();
  const ttl = Math.max(1700, 2900 - elapsed * 25); // speeds up over time
  return {
    id, valid, ttl, born: Date.now(),
    text: valid ? (mode === "v4" ? validV4() : validV6()) : bad.text,
    why: valid ? "" : bad.why,
    ...spot(mode, others), dx: (Math.random() - 0.5) * 6,
  };
}

/** A free spot: stays inside the arena (IPv6 text is long) and away from the other targets. */
function spot(mode: Mode, others: Target[]) {
  const maxX = mode === "v6" ? 22 : 52;
  let best = { x: 4 + Math.random() * maxX, y: 10 + Math.random() * 74 }, bestGap = -1;
  for (let t = 0; t < 14; t++) {
    const c = { x: 4 + Math.random() * maxX, y: 10 + Math.random() * 74 };
    const gap = Math.min(99, ...others.map((o) => Math.abs(o.y - c.y) * 2 + Math.abs(o.x - c.x) * 0.5));
    if (gap > bestGap) { best = c; bestGap = gap; }
    if (gap > 26) break;
  }
  return best;
}

// ---------------------------------------------------------------- the game
export function IpBlaster() {
  const [mode, setMode] = useState<Mode>("v4");
  const [phase, setPhase] = useState<"start" | "play" | "done">("start");
  const [targets, setTargets] = useState<Target[]>([]);
  const [fx, setFx] = useState<Fx[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [escaped, setEscaped] = useState(0);
  const [left, setLeft] = useState(GAME_SECONDS);
  const [toast, setToast] = useState<string | null>(null);
  const [cross, setCross] = useState<{ x: number; y: number } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const arena = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const started = useRef(0);
  const shake = useAnimationControls();

  const start = () => {
    unlock();
    setTargets([]); setFx([]); setScore(0); setCombo(0); setHits(0); setWrong(0); setEscaped(0); setLessons([]); setToast(null);
    setLeft(GAME_SECONDS); started.current = Date.now(); setPhase("play"); sfx("round");
  };

  // spawn, expire and clock
  useEffect(() => {
    if (phase !== "play") return;
    const tick = setInterval(() => {
      const elapsed = (Date.now() - started.current) / 1000;
      const remain = Math.max(0, GAME_SECONDS - elapsed);
      setLeft(remain);
      if (remain <= 0) { setPhase("done"); return; }
      setTargets((ts) => {
        const now = Date.now();
        const alive = ts.filter((t) => now - t.born < t.ttl);
        const gone = ts.filter((t) => now - t.born >= t.ttl && t.valid).length;
        if (gone) { setEscaped((e) => e + gone); setCombo(0); }
        const maxOn = elapsed < 15 ? 4 : elapsed < 30 ? 5 : 6;
        if (alive.length < maxOn && Math.random() < 0.55) alive.push(makeTarget(mode, nextId.current++, elapsed, alive));
        return alive;
      });
    }, 260);
    return () => clearInterval(tick);
  }, [phase, mode]);

  const boom = (x: number, y: number, text: string, good: boolean) => {
    const id = nextId.current++;
    setFx((f) => [...f, { id, x, y, text, good }]);
    setTimeout(() => setFx((f) => f.filter((e) => e.id !== id)), 700);
  };

  const shoot = useCallback((t: Target, e: React.PointerEvent) => {
    e.stopPropagation();
    const box = arena.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 100, y = ((e.clientY - box.top) / box.height) * 100;
    setTargets((ts) => ts.filter((o) => o.id !== t.id));
    if (t.valid) {
      const mult = 1 + Math.floor(combo / 4) * 0.5;
      const pts = Math.round(100 * mult);
      setScore((s) => s + pts); setHits((h) => h + 1); setCombo((c) => c + 1);
      boom(x, y, `+${pts}${mult > 1 ? ` ×${mult}` : ""}`, true); sfx("lock");
    } else {
      setScore((s) => Math.max(0, s - 50)); setWrong((w) => w + 1); setCombo(0);
      setLessons((l) => [...l, { wrong: t.text, why: t.why }]);
      setToast(`❌ ${t.why}`); setTimeout(() => setToast((m) => (m === `❌ ${t.why}` ? null : m)), 1800);
      boom(x, y, "-50", false); sfx("wrong");
      shake.start({ x: [0, -8, 7, -4, 0], transition: { duration: 0.3 } });
    }
  }, [combo, shake]);

  const acc = hits + wrong ? hits / (hits + wrong) : 0;
  const success = hits >= WIN_HITS && acc >= WIN_ACC;
  const game = mode === "v4" ? "ip-blaster-v4" : "ip-blaster-v6";

  if (phase === "start") return (
    <StartScreen title="IP BLASTER" emoji="🎯" onStart={start}
      how={[
        mode === "v4" ? "Shoot every VALID IPv4 address: 4 numbers from 0 to 255, separated by dots." : "Shoot every VALID IPv6 address: 8 groups of hex (0–9, a–f) separated by colons.",
        "DON'T shoot fakes: numbers over 255, the wrong number of parts, MAC addresses, the other IP version…",
        "Hit valid targets in a row for a combo multiplier. Shooting a fake costs 50 points and your combo.",
        `${GAME_SECONDS} seconds. It speeds up as you go!`,
      ]}
      goal={`hit at least ${WIN_HITS} valid addresses with ${Math.round(WIN_ACC * 100)}%+ accuracy`}
      extra={
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {(["v4", "v6"] as Mode[]).map((m) => (
              <button key={m} className={cn("btn h-auto flex-col py-2", mode === m ? "btn-primary" : "btn-ghost")} onClick={() => setMode(m)}>
                <span className="font-display text-lg">{m === "v4" ? "IPv4" : "IPv6"}</span>
                <span className="text-xs opacity-80">{m === "v4" ? "Rookie" : "Elite"}</span>
              </button>
            ))}
          </div>
          <div className="rounded bg-surface2 p-2 text-left text-xs">
            <b>📡 Intel briefing:</b> An <b>IP address</b> identifies a device <b>on a network</b> and <b>can change</b> (e.g. a new one at a café).
            <b> IPv4</b> = 32 bits, 4 numbers 0–255 (<code>192.168.1.10</code>). <b>IPv6</b> = 128 bits, 8 groups of hex (<code>2001:db8:85a3:0:0:8a2e:370:7334</code>), so there are far more addresses.
            A <b>MAC address</b> is different: fixed, 6 pairs of hex.
          </div>
        </div>
      } />
  );

  if (phase === "done") return (
    <ResultScreen game={game} success={success} score={score} onAgain={() => setPhase("start")} lessons={lessons}
      stats={[{ label: "Score", value: String(score) }, { label: "Hits", value: `${hits}/${WIN_HITS}` }, { label: "Accuracy", value: `${Math.round(acc * 100)}%` }, { label: "Escaped", value: String(escaped) }]}
      winText={`Target practice complete, agent. You can spot a valid ${mode === "v4" ? "IPv4" : "IPv6"} address under pressure.`}
      loseText={hits < WIN_HITS ? `You needed ${WIN_HITS} hits, you got ${hits}. Shoot faster!` : `Too many fakes shot (${Math.round(acc * 100)}% accuracy, need ${Math.round(WIN_ACC * 100)}%). Read the lessons below, then try again.`} />
  );

  return (
    <div className="space-y-2">
      {/* HUD */}
      <div className="flex items-center justify-between gap-2 font-display">
        <span className="chip">🎯 {score}</span>
        <span className={cn("chip", combo >= 4 && "text-warn")}>{combo >= 4 ? `🔥 COMBO ×${1 + Math.floor(combo / 4) * 0.5}` : `combo ${combo}`}</span>
        <span className="chip">✅ {hits}/{WIN_HITS}</span>
        <span className={cn("chip tabular-nums", left < 10 && "text-bad")}>⏱ {Math.ceil(left)}s</span>
      </div>
      <motion.div animate={shake} ref={arena}
        className="relative h-[60vh] min-h-[360px] select-none overflow-hidden rounded-xl border-2 border-line"
        style={{ cursor: "none", background: "radial-gradient(circle at 50% 120%, #1e293b, #020617 70%)",
          backgroundImage: "radial-gradient(circle at 50% 120%, #1e293b, #020617 70%), linear-gradient(rgba(56,189,248,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.07) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 40px 40px, 40px 40px" }}
        onPointerMove={(e) => { const b = arena.current!.getBoundingClientRect(); setCross({ x: e.clientX - b.left, y: e.clientY - b.top }); }}
        onPointerLeave={() => setCross(null)}
        onPointerDown={(e) => { const b = arena.current!.getBoundingClientRect(); boom(((e.clientX - b.left) / b.width) * 100, ((e.clientY - b.top) / b.height) * 100, "", true); }}>
        <AnimatePresence>
          {targets.map((t) => (
            <motion.button key={t.id} type="button" onPointerDown={(e) => shoot(t, e)}
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1, x: t.dx * 6 }} exit={{ scale: 0.3, opacity: 0 }}
              transition={{ x: { duration: t.ttl / 1000, ease: "linear" }, default: { type: "spring", stiffness: 300, damping: 18 } }}
              className="absolute whitespace-nowrap rounded-lg border-2 border-sky-400/70 bg-slate-900/90 px-2 py-1.5 font-mono text-[10px] font-bold text-sky-100 shadow-[0_0_18px_rgba(56,189,248,.45)] sm:text-sm"
              style={{ left: `${t.x}%`, top: `${t.y}%`, cursor: "none" }}>
              <span className="pointer-events-none absolute -left-1 -top-1 h-2 w-2 border-l-2 border-t-2 border-red-400" />
              <span className="pointer-events-none absolute -right-1 -top-1 h-2 w-2 border-r-2 border-t-2 border-red-400" />
              <span className="pointer-events-none absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 border-red-400" />
              <span className="pointer-events-none absolute -bottom-1 -right-1 h-2 w-2 border-b-2 border-r-2 border-red-400" />
              {t.text}
              <motion.span className="absolute inset-x-1 -bottom-1.5 h-0.5 origin-left rounded bg-red-400" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: t.ttl / 1000, ease: "linear" }} />
            </motion.button>
          ))}
        </AnimatePresence>
        {/* hit markers, muzzle flashes */}
        <AnimatePresence>
          {fx.map((f) => (
            <motion.div key={f.id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${f.x}%`, top: `${f.y}%` }}
              initial={{ opacity: 1, scale: 0.6 }} animate={{ opacity: 0, scale: 1.6, y: -30 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
              {f.text ? <span className={cn("font-display text-xl drop-shadow", f.good ? "text-yellow-300" : "text-red-400")}>{f.text}</span>
                : <span className="block h-6 w-6 rounded-full bg-yellow-200/80 blur-[2px]" />}
            </motion.div>
          ))}
        </AnimatePresence>
        {/* crosshair */}
        {cross && (
          <div className="pointer-events-none absolute" style={{ left: cross.x - 18, top: cross.y - 18 }}>
            <svg width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="11" fill="none" stroke="#f87171" strokeWidth="2" />
              <path d="M18 2v9M18 25v9M2 18h9M25 18h9" stroke="#f87171" strokeWidth="2" /><circle cx="18" cy="18" r="1.6" fill="#f87171" /></svg>
          </div>
        )}
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-3 bottom-3 rounded-lg border border-red-500/50 bg-red-950/90 px-3 py-2 text-center text-xs font-bold text-red-100 sm:text-sm">{toast}</motion.div>
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute left-3 top-2 text-[10px] font-bold uppercase tracking-[0.3em] text-sky-300/60">target: valid {mode === "v4" ? "IPv4" : "IPv6"}</div>
      </motion.div>
    </div>
  );
}
