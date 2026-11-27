"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { CpuScene } from "@/lib/viz/cpu";
import { SCENARIOS, type ControlScene } from "@/lib/viz/control";

/** What every scene gets. */
export type SceneProps<S> = {
  scene: S;
  shared: Record<string, unknown>;                 // live/replay shared state (e.g. slider value)
  setShared?: (s: Record<string, unknown>) => void; // present only for whoever is allowed to drive it
  sandbox?: boolean;
  tap?: { targets: string[]; picked?: string | null; correct?: string | null; onTap?: (id: string) => void };
};

/* ------------------------------------------------------------------ helpers */
function Tappable({ id, tap, className, children }: { id: string; tap?: SceneProps<unknown>["tap"]; className?: string; children: React.ReactNode }) {
  const can = !!tap?.onTap && tap.targets.includes(id);
  const picked = tap?.picked === id, right = tap?.correct === id, wrongPick = !!tap?.correct && picked && !right;
  const Comp = can ? "button" : "div";
  return (
    <Comp type={can ? "button" : undefined} onClick={can ? () => tap!.onTap!(id) : undefined}
      className={cn(className, can && "cursor-pointer ring-offset-2 ring-offset-surface hover:ring-2 hover:ring-accent/60",
        can && !picked && "animate-[pulse_2s_ease-in-out_infinite]",
        picked && "ring-4 ring-accent", right && "!ring-4 !ring-good", wrongPick && "!ring-4 !ring-bad")}>
      {children}
    </Comp>
  );
}

/* ------------------------------------------------------------------ CPU */
const REG_NAMES: Record<string, string> = { PC: "Program Counter", MAR: "Memory Address Reg.", MDR: "Memory Data Reg.", CIR: "Current Instruction Reg.", ACC: "Accumulator" };
const STAGE_COLOR = { FETCH: "bg-sky-500", DECODE: "bg-amber-500", EXECUTE: "bg-emerald-500" } as const;

export function CpuView({ scene, tap }: SceneProps<CpuScene>) {
  const hi = new Set(scene.hi || []);
  const lanes = [
    { id: "address", name: "Address bus", note: "one-way: CPU → RAM" },
    { id: "data", name: "Data bus", note: "two-way" },
    { id: "control", name: "Control bus", note: "two-way signals" },
  ] as const;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_150px_minmax(0,1fr)]">
        {/* CPU */}
        <div className="relative rounded-xl border-2 border-primary/60 bg-primary/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-display text-xl">CPU</span>
            <AnimatePresence mode="wait">
              {scene.stage && <motion.span key={scene.stage} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className={cn("rounded-full px-3 py-0.5 text-xs font-black tracking-widest text-white", STAGE_COLOR[scene.stage])}>{scene.stage}</motion.span>}
            </AnimatePresence>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Tappable id="CU" tap={tap} className={cn("rounded-lg border-2 p-2 text-left transition", hi.has("CU") || scene.cu ? "border-amber-400 bg-amber-400/15" : "border-line bg-surface")}>
              <div className="font-display">CU</div><div className="text-[10px] leading-tight text-muted">Control Unit: decodes &amp; directs</div>
            </Tappable>
            <Tappable id="ALU" tap={tap} className={cn("rounded-lg border-2 p-2 text-left transition", hi.has("ALU") || scene.alu ? "border-emerald-400 bg-emerald-400/15" : "border-line bg-surface")}>
              <div className="font-display">ALU</div><div className="text-[10px] leading-tight text-muted">Arithmetic Logic Unit: maths &amp; logic</div>
            </Tappable>
          </div>
          <AnimatePresence>
            {(scene.cu || scene.alu) && (
              <motion.div key={scene.cu || scene.alu} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
                className={cn("mt-2 rounded-lg px-2 py-1.5 text-xs font-bold", scene.cu ? "bg-amber-400/20" : "bg-emerald-400/20")}>
                {scene.cu ? `💬 CU: ${scene.cu}` : `🧮 ALU: ${scene.alu}`}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-3 lg:grid-cols-5">
            {(["PC", "MAR", "MDR", "CIR", "ACC"] as const).map((r) => (
              <Tappable key={r} id={r} tap={tap}
                className={cn("rounded-lg border-2 p-1.5 text-center transition", hi.has(r) ? "border-accent bg-accent/15 shadow-[0_0_12px_rgb(var(--accent)/0.5)]" : "border-line bg-surface")}>
                <div className="font-display text-sm leading-none">{r}</div>
                <div className="truncate text-[9px] leading-tight text-muted">{REG_NAMES[r]}</div>
                <motion.div key={scene.regs[r]} initial={{ scale: 1.6, color: "rgb(var(--accent))" }} animate={{ scale: 1, color: "rgb(var(--ink))" }}
                  className="mt-1 min-h-[1.25rem] rounded bg-surface2 font-mono text-xs font-bold">{scene.regs[r] || "–"}</motion.div>
              </Tappable>
            ))}
          </div>
          {scene.move && (
            <motion.div key={scene.move.from + scene.move.to} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="mt-2 text-center text-xs font-bold text-accent">{scene.move.from} ➜ {scene.move.to}: <code>{scene.move.label}</code></motion.div>
          )}
        </div>

        {/* buses */}
        <div className="flex flex-row gap-2 md:flex-col md:justify-center">
          {lanes.map((l) => {
            const active = scene.bus?.lane === l.id || hi.has(`bus-${l.id}`);
            const moving = scene.bus?.lane === l.id ? scene.bus : null;
            return (
              <div key={l.id} className={cn("relative flex-1 overflow-hidden rounded-lg border-2 px-1.5 py-1 text-center transition", active ? "border-accent bg-accent/10" : "border-line bg-surface2 opacity-70")}>
                <div className="text-[11px] font-black leading-tight">{l.name}</div>
                <div className="text-[9px] leading-tight text-muted">{l.note}</div>
                <div className="relative mt-1 h-5">
                  <div className={cn("absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded", active ? "bg-accent/60" : "bg-line")} />
                  {moving && (
                    <motion.span key={moving.label + moving.dir} className="absolute top-0 rounded bg-accent px-1 font-mono text-[10px] font-bold text-white"
                      initial={{ left: moving.dir === "toRam" ? "0%" : "70%" }} animate={{ left: moving.dir === "toRam" ? "70%" : "0%" }}
                      transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 0.4, ease: "easeInOut" }}>{moving.label}</motion.span>
                  )}
                  {!moving && active && <motion.span className="absolute top-1 h-3 w-3 rounded-full bg-accent" initial={{ left: "0%" }} animate={{ left: "85%" }} transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }} />}
                </div>
                <div className="text-[9px] text-muted md:hidden">{moving ? (moving.dir === "toRam" ? "⬇ to RAM" : "⬆ to CPU") : ""}</div>
              </div>
            );
          })}
        </div>

        {/* RAM */}
        <Tappable id="RAM" tap={tap} className={cn("rounded-xl border-2 p-3 text-left", hi.has("RAM") ? "border-accent bg-accent/5" : "border-line bg-surface")}>
          <div className="mb-2 flex items-center justify-between"><span className="font-display text-xl">RAM</span><span className="text-[10px] text-muted">main memory</span></div>
          <div className="grid grid-cols-[auto_1fr] overflow-hidden rounded-lg border-2 border-line font-mono text-xs">
            {scene.ram.map((v, a) => {
              const isCode = a <= 3, on = scene.ramHi === a;
              const glow = (hi.has("code") && isCode) || (hi.has("data") && !isCode && v);
              return (
                <div key={a} className="contents">
                  <div className={cn("border-b border-line bg-surface2 px-2 py-1 text-muted", on && "bg-accent text-white")}>{a}</div>
                  <motion.div animate={on ? { backgroundColor: ["rgb(var(--accent)/0.0)", "rgb(var(--accent)/0.35)", "rgb(var(--accent)/0.15)"] } : {}} transition={{ duration: 0.8 }}
                    className={cn("flex items-center justify-between border-b border-l border-line px-2 py-1 font-bold",
                      isCode ? "text-violet-600 dark:text-violet-300" : "text-teal-600 dark:text-teal-300", glow && (isCode ? "bg-violet-500/15" : "bg-teal-500/15"))}>
                    <span>{v || "·"}</span>
                    <span className="text-[9px] font-normal text-muted">{v ? (isCode ? "instruction" : "data") : ""}</span>
                  </motion.div>
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex gap-2 text-[10px]"><span className="text-violet-600 dark:text-violet-300">■ instructions</span><span className="text-teal-600 dark:text-teal-300">■ data</span><span className="text-muted">same memory!</span></div>
        </Tappable>
      </div>

      {scene.showPerf && (
        <div className="grid gap-2 sm:grid-cols-3">
          {[["⏱️", "Clock speed", "More cycles per second (GHz)"], ["🧩", "Cores", "More instructions at the same time"], ["⚡", "Cache", "Fast memory near the CPU = fewer trips to RAM"]].map(([e, t, d]) => (
            <motion.div key={t} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-xl border-2 border-xp/60 bg-xp/10 p-3">
              <div className="text-2xl">{e}</div><div className="font-display">{t}</div><div className="text-xs text-muted">{d}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Control lab */
export function ControlView({ scene, shared, setShared, sandbox, tap }: SceneProps<ControlScene>) {
  const sc = SCENARIOS[scene.scenario];
  const value = sandbox && typeof shared.value === "number" ? (shared.value as number) : scene.value;
  const on = !scene.monitoring && sc.on(value);
  const hi = new Set(scene.hi || []);
  const [sim, setSim] = useState(false);
  const v = useRef(value);
  v.current = value;

  // feedback simulation (greenhouse): heater on → warms up; off → cools down
  useEffect(() => {
    if (!sim || !setShared) return;
    const t = setInterval(() => {
      const cur = v.current;
      const next = sc.on(cur) ? Math.min(sc.max, cur + 1) : Math.max(sc.min, cur - 1);
      setShared({ value: next });
    }, 700);
    return () => clearInterval(t);
  }, [sim, setShared, sc]);

  const pct = ((value - sc.min) / (sc.max - sc.min)) * 100;
  const box = (id: string, extra?: string) => cn("rounded-xl border-2 p-2.5 text-center transition", hi.has(id as never) ? "border-accent bg-accent/10 shadow-[0_0_14px_rgb(var(--accent)/0.35)]" : "border-line bg-surface", extra);
  const arrow = <div className="grid place-items-center text-2xl text-muted md:rotate-0"><span className="md:hidden">⬇</span><span className="hidden md:inline">➜</span></div>;

  return (
    <div className="space-y-3">
      {/* the world */}
      <div className={cn("relative overflow-hidden rounded-xl border-2 border-line p-3 transition-colors duration-700",
        scene.scenario === "street" ? (value < 30 ? "bg-slate-900 text-white" : value < 60 ? "bg-sky-700 text-white" : "bg-sky-300") :
        scene.scenario === "greenhouse" ? (value < 18 ? "bg-cyan-100 dark:bg-cyan-950" : value > 26 ? "bg-orange-100 dark:bg-orange-950" : "bg-green-100 dark:bg-green-950") : "bg-surface2")}>
        <div className="flex items-center gap-3">
          <div className="text-5xl">{sc.world}</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg">{sc.name}</div>
            <div className="text-xs opacity-80">{scene.monitoring ? "Monitoring only: readings are recorded, nothing is switched" : `Rule: ${sc.rule}`}</div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/15"><motion.div className="h-full rounded-full bg-accent" animate={{ width: `${pct}%` }} /></div>
          </div>
          <motion.div key={String(on)} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-right">
            <div className="text-3xl">{scene.monitoring ? "📊" : on ? sc.actuatorEmoji : "⭘"}</div>
            {!scene.monitoring && <div className={cn("text-xs font-black", on ? "text-good" : "opacity-70")}>{sc.actuator} {on ? "ON" : "OFF"}</div>}
          </motion.div>
        </div>
        {scene.scenario === "alarm" && on && <motion.div className="pointer-events-none absolute inset-0 bg-red-500/25" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />}
      </div>

      {/* the pipeline */}
      <div className="grid gap-1 md:grid-cols-[1fr_auto_1fr_auto_1.3fr_auto_1fr]">
        <Tappable id="sensor" tap={tap} className={box("sensor")}>
          <div className="text-3xl">{sc.sensorEmoji}</div>
          <div className="text-xs font-black">SENSOR</div>
          <div className="text-[11px] text-muted">{sc.sensor}</div>
          <div className="mt-1 rounded bg-surface2 px-1 font-mono text-xs font-bold">{sc.fmt(value)}</div>
        </Tappable>
        {arrow}
        <Tappable id="adc" tap={tap} className={box("adc")}>
          <div className="text-3xl">〰️➜🔢</div>
          <div className="text-xs font-black">ADC</div>
          <div className="text-[11px] text-muted">analogue → digital</div>
          <div className="mt-1 rounded bg-surface2 px-1 font-mono text-xs font-bold">{Math.max(0, Math.round(value)).toString(2).padStart(8, "0")}</div>
        </Tappable>
        {arrow}
        <Tappable id="mp" tap={tap} className={box("mp")}>
          <div className="text-3xl">🧠</div>
          <div className="text-xs font-black">MICROPROCESSOR</div>
          <div className="text-[11px] text-muted">compares with preset: {sc.fmt(sc.preset)}</div>
          <motion.div key={String(on) + value} initial={{ opacity: 0.3 }} animate={{ opacity: 1 }}
            className={cn("mt-1 rounded px-1 text-xs font-bold", scene.monitoring ? "bg-surface2" : on ? "bg-good/20 text-good" : "bg-surface2")}>
            {scene.monitoring ? "record + display reading" : `${sc.fmt(value)} → ${on ? "switch ON" : "switch OFF"}`}
          </motion.div>
        </Tappable>
        {arrow}
        <Tappable id="actuator" tap={tap} className={box("actuator", scene.monitoring ? "border-dashed opacity-80" : on ? "border-good bg-good/10" : "")}>
          <motion.div className="text-3xl" animate={on ? { scale: [1, 1.2, 1] } : { scale: 1 }} transition={{ duration: 0.8, repeat: on ? Infinity : 0 }}>{scene.monitoring ? "🖥️" : sc.actuatorEmoji}</motion.div>
          <div className="text-xs font-black">{scene.monitoring ? "OUTPUT (screen)" : "ACTUATOR"}</div>
          <div className="text-[11px] text-muted">{scene.monitoring ? "no actuator" : sc.actuator}</div>
          {!scene.monitoring && <div className={cn("mt-1 rounded px-1 text-xs font-black", on ? "bg-good text-white" : "bg-surface2")}>{on ? "ON" : "OFF"}</div>}
        </Tappable>
      </div>

      {scene.showLoop && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border-2 border-dashed border-accent bg-accent/5 px-3 py-2 text-center text-xs font-bold">
          🔁 FEEDBACK: the actuator changes the {scene.scenario === "greenhouse" ? "temperature" : "conditions"} → the sensor measures again → repeat continuously
        </motion.div>
      )}

      {sandbox && (
        <div className="rounded-xl border-2 border-line bg-surface2 p-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>{sc.sensorEmoji} {sc.sensor}: {sc.fmt(value)}</span>
            {!setShared && <span className="text-muted">🔒 Your tutor controls this</span>}
          </div>
          <input type="range" min={sc.min} max={sc.max} value={value} disabled={!setShared}
            onChange={(e) => setShared?.({ value: Number(e.target.value) })} className="mt-2 w-full accent-[rgb(var(--accent))]" aria-label={sc.sensor} />
          {setShared && scene.scenario === "greenhouse" && (
            <button className={cn("btn btn-sm mt-2", sim ? "btn-accent" : "btn-ghost")} onClick={() => setSim((s) => !s)}>{sim ? "⏸ Stop feedback simulation" : "▶ Simulate the feedback loop"}</button>
          )}
        </div>
      )}
    </div>
  );
}

/** Scene picture for each viz id. */
export const SCENES: Record<string, (p: SceneProps<never>) => React.ReactNode> = {
  "cpu-fde": CpuView as never,
  "control-lab": ControlView as never,
};
