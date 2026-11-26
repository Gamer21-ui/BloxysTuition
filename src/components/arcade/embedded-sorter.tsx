"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { CheatSheet, ResultScreen, StartScreen, type Lesson } from "./shared";

type Item = { emoji: string; name: string; embedded: boolean; why: string };
const POOL: Item[] = [
  { emoji: "🧺", name: "Washing machine", embedded: true, why: "its microprocessor only runs wash cycles (one dedicated job)" },
  { emoji: "🍲", name: "Microwave oven", embedded: true, why: "it only controls heating time and power" },
  { emoji: "🚦", name: "Traffic lights", embedded: true, why: "they only control the light sequence and sensors" },
  { emoji: "⌚", name: "Digital watch", embedded: true, why: "it only keeps and shows the time (plus alarms)" },
  { emoji: "🚗", name: "Car engine management", embedded: true, why: "it only controls fuel and ignition inside the car" },
  { emoji: "🛑", name: "Car ABS brakes", embedded: true, why: "it only stops the wheels locking when braking" },
  { emoji: "🌡️", name: "Smart thermostat", embedded: true, why: "it only reads the temperature and switches the heating" },
  { emoji: "🚨", name: "Burglar alarm", embedded: true, why: "it only monitors sensors and sounds the alarm" },
  { emoji: "🍽️", name: "Dishwasher", embedded: true, why: "it only runs washing programmes" },
  { emoji: "📷", name: "Digital camera", embedded: true, why: "its processor is dedicated to taking and storing photos" },
  { emoji: "🧭", name: "Car satnav (GPS)", embedded: true, why: "it is built in just to calculate routes" },
  { emoji: "🏃", name: "Fitness tracker", embedded: true, why: "it only tracks steps, heart rate and sleep" },
  { emoji: "🥤", name: "Vending machine", embedded: true, why: "it only handles payment and dispensing" },
  { emoji: "📶", name: "Wi-Fi router", embedded: true, why: "its processor is dedicated to routing network traffic" },
  { emoji: "❄️", name: "Smart fridge", embedded: true, why: "it controls cooling as its dedicated job" },
  { emoji: "💓", name: "Pacemaker", embedded: true, why: "it only monitors and controls the heartbeat" },
  { emoji: "🖥️", name: "Desktop PC", embedded: false, why: "it can run any program you install: general-purpose" },
  { emoji: "💻", name: "Laptop", embedded: false, why: "it runs many different programs: general-purpose" },
  { emoji: "📱", name: "Tablet", embedded: false, why: "you install all sorts of apps on it: general-purpose" },
  { emoji: "🎮", name: "Gaming PC", embedded: false, why: "a full computer that runs any software: general-purpose" },
  { emoji: "🏫", name: "School lab computer", embedded: false, why: "used for lots of different tasks: general-purpose" },
  { emoji: "🧑‍💻", name: "Office workstation", embedded: false, why: "runs word processors, browsers, anything: general-purpose" },
  { emoji: "📦", name: "Home server PC", embedded: false, why: "a full computer you can install anything on: general-purpose" },
];
const ROUND = 20;
const WIN_CORRECT = 16;
const LIVES = 3;

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function deal() {
  const gen = POOL.filter((p) => !p.embedded), emb = shuffle(POOL.filter((p) => p.embedded)).slice(0, ROUND - gen.length);
  return shuffle([...gen, ...emb]);
}

export function EmbeddedSorter() {
  const [phase, setPhase] = useState<"start" | "play" | "done">("start");
  const [queue, setQueue] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [fly, setFly] = useState<null | "left" | "right" | "drop" | "shake">(null);
  const [toast, setToast] = useState<{ t: string; good: boolean } | null>(null);
  const [beltKey, setBeltKey] = useState(0);
  const lock = useRef(false);
  const item = queue[i];
  const speed = Math.max(2.2, 4.6 - i * 0.13); // seconds to cross the belt, faster over time

  const begin = () => { unlock(); setQueue(deal()); setI(0); setCorrect(0); setLives(LIVES); setStreak(0); setScore(0); setLessons([]); setFly(null); setToast(null); setBeltKey((k) => k + 1); lock.current = false; setPhase("play"); sfx("round"); };

  const advance = useCallback((livesLeft: number) => {
    setTimeout(() => {
      setFly(null); lock.current = false;
      if (livesLeft <= 0 || i + 1 >= ROUND) { setPhase("done"); return; }
      setI((n) => n + 1); setBeltKey((k) => k + 1);
    }, 650);
  }, [i]);

  const sort = useCallback((asEmbedded: boolean | null) => {
    if (!item || lock.current) return;
    lock.current = true;
    if (asEmbedded === item.embedded) {
      const s = streak + 1;
      setCorrect((c) => c + 1); setStreak(s); setScore((x) => x + 100 + Math.min(s, 10) * 10);
      setFly(asEmbedded ? "left" : "right"); setToast({ t: `✅ ${item.name}: ${item.why}`, good: true }); sfx("lock");
      advance(lives);
    } else {
      const nl = lives - 1;
      setLives(nl); setStreak(0);
      setFly(asEmbedded === null ? "drop" : "shake");
      const why = `${item.embedded ? "EMBEDDED" : "GENERAL-PURPOSE"}: ${item.why}`;
      setToast({ t: asEmbedded === null ? `⏰ Too slow! ${item.name} is ${why}` : `❌ ${item.name} is ${why}`, good: false });
      setLessons((l) => [...l, { wrong: item.name, why }]);
      sfx("wrong");
      advance(nl);
    }
  }, [item, streak, lives, advance]);

  // keyboard: ← embedded, → general
  useEffect(() => {
    if (phase !== "play") return;
    const k = (e: KeyboardEvent) => { if (e.key === "ArrowLeft") sort(true); if (e.key === "ArrowRight") sort(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [phase, sort]);

  const success = phase === "done" && correct >= WIN_CORRECT;

  if (phase === "start") return (
    <StartScreen title="EMBEDDED SORTER" emoji="🏭" onStart={begin}
      how={[
        "Devices roll along the factory belt. Sort each one before it falls off the end!",
        "🔌 EMBEDDED = a microprocessor inside a bigger device, doing ONE dedicated job (washing machine, traffic lights…).",
        "💻 GENERAL-PURPOSE = a computer that can run any program (laptop, desktop…).",
        `The belt speeds up. ${LIVES} lives: a wrong sort or a dropped device costs one. On a keyboard, use ← and →.`,
      ]}
      goal={`sort at least ${WIN_CORRECT} of ${ROUND} devices correctly`}
      tips={[
        "Ask: \"Can I install new apps or programs on it?\" Yes = GENERAL-PURPOSE. No = EMBEDDED.",
        "Is it part of a bigger machine or appliance (car, oven, alarm)? That's EMBEDDED.",
        "Does it do ONE job (wash, heat, time, route)? That's EMBEDDED.",
        "Laptops, desktops, tablets and any \"PC\" are general-purpose.",
        "Most devices are embedded! General-purpose ones are rarer, so look out for them.",
      ]}
      extra={<div className="rounded bg-surface2 p-2 text-left text-xs"><b>🔌 Embedded systems</b> are small, cheap, low-power and reliable, but they&apos;re hard to upgrade and only do one job.</div>} />
  );
  if (phase === "done") return (
    <ResultScreen game="embedded-sorter" success={success} score={score} onAgain={() => setPhase("start")} lessons={lessons}
      stats={[{ label: "Correct", value: `${correct}/${ROUND}` }, { label: "Score", value: String(score) }, { label: "Lives left", value: "❤️".repeat(Math.max(0, lives)) || "0" }]}
      winText="Factory saved! You can tell an embedded system from a general-purpose computer at speed."
      loseText={lives <= 0 ? "Out of lives! Check the lessons below: they're exactly what the exam asks." : `You sorted ${correct}, you needed ${WIN_CORRECT}. So close!`} />
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 font-display">
        <span className="chip">📦 {Math.min(i + 1, ROUND)}/{ROUND}</span>
        <span className={cn("chip", streak >= 3 && "text-warn")}>{streak >= 3 ? `🔥 ${streak} streak` : `streak ${streak}`}</span>
        <span className="chip">✅ {correct}/{WIN_CORRECT}</span>
        <span className="chip">{"❤️".repeat(Math.max(0, lives))}{"🖤".repeat(LIVES - Math.max(0, lives))}</span>
      </div>

      {/* belt */}
      <div className="relative h-56 overflow-hidden rounded-xl border-2 border-line bg-gradient-to-b from-slate-800 to-slate-950">
        <div className="absolute inset-x-0 bottom-10 h-10 bg-slate-700"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, #334155 0 18px, #475569 18px 36px)", animation: `fb-belt ${speed / 4}s linear infinite` }} />
        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-3 text-xs">{Array.from({ length: 8 }, (_, k) => <span key={k} className="h-4 w-4 rounded-full border-2 border-slate-500 bg-slate-800" />)}</div>
        <div className="absolute bottom-0 right-0 top-0 w-6 bg-gradient-to-l from-black/80 to-transparent" />
        <AnimatePresence mode="wait">
          {item && (
            <motion.div key={beltKey}
              initial={{ left: "-20%", y: 0, rotate: 0, opacity: 1 }}
              animate={fly === "left" ? { y: 160, left: "15%", opacity: 0, rotate: -25 } : fly === "right" ? { y: 160, left: "70%", opacity: 0, rotate: 25 }
                : fly === "drop" ? { y: 220, rotate: 70, opacity: 0 } : fly === "shake" ? { x: [0, -10, 10, -6, 0], opacity: [1, 1, 1, 1, 0] }
                : { left: "100%" }}
              transition={fly ? { duration: 0.6 } : { duration: speed, ease: "linear" }}
              onAnimationComplete={() => { if (!fly && !lock.current) sort(null); }}
              className="absolute bottom-20 w-40 rounded-xl border-2 border-white/20 bg-slate-900/95 p-2 text-center text-white shadow-2xl">
              <div className="text-4xl">{item.emoji}</div>
              <div className="text-sm font-bold leading-tight">{item.name}</div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="pointer-events-none absolute left-3 top-2 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">🏭 sort before it drops →</div>
      </div>

      {/* bins */}
      <div className="grid grid-cols-2 gap-3">
        <button className="btn h-auto flex-col gap-1 border-good bg-good/15 py-4 text-lg" onClick={() => sort(true)}><span className="text-3xl">🔌</span>EMBEDDED<span className="text-xs font-normal opacity-70">one dedicated job · ←</span></button>
        <button className="btn h-auto flex-col gap-1 border-accent bg-accent/15 py-4 text-lg" onClick={() => sort(false)}><span className="text-3xl">💻</span>GENERAL-PURPOSE<span className="text-xs font-normal opacity-70">runs any program · →</span></button>
      </div>
      <CheatSheet items={["can install apps? → 💻", "one job? → 🔌", "inside a machine? → 🔌", "laptop / PC / tablet → 💻"]} />
      <AnimatePresence mode="wait">
        {toast && <motion.div key={toast.t} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
          className={cn("rounded-lg border-2 px-3 py-2 text-sm font-bold", toast.good ? "border-good bg-good/10" : "border-bad bg-bad/10")}>{toast.t}</motion.div>}
      </AnimatePresence>
    </div>
  );
}
