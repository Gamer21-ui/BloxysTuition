"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { CheatSheet, ResultScreen, StartScreen, type Lesson } from "./shared";

/** Topic 6 · automated systems: for each scenario pick the right SENSOR (input) and ACTUATOR (output). */
type Sc = { place: string; goal: string; sensor: string; actuator: string; loop: string };
const SCENARIOS: Sc[] = [
  { place: "Greenhouse", goal: "Keep the plants warm at night", sensor: "Temperature", actuator: "Heater", loop: "temperature below the stored value → microprocessor switches the heater on" },
  { place: "Greenhouse", goal: "Water the plants when the soil is dry", sensor: "Moisture", actuator: "Water pump", loop: "moisture below the stored value → microprocessor turns the pump on" },
  { place: "Street", goal: "Switch the street lights on at dusk", sensor: "Light", actuator: "Lamp", loop: "light level below the stored value → microprocessor switches the lamps on" },
  { place: "House", goal: "Sound an alarm when an intruder moves", sensor: "Infrared", actuator: "Siren", loop: "infrared detects body heat/movement → microprocessor sounds the siren" },
  { place: "Shop entrance", goal: "Open the doors when someone arrives", sensor: "Infrared", actuator: "Motor", loop: "someone detected → microprocessor drives the door motor" },
  { place: "Car park", goal: "Lift the barrier when a car drives up", sensor: "Pressure", actuator: "Motor", loop: "car's weight on the pad → microprocessor drives the barrier motor" },
  { place: "Bathroom", goal: "Clear the steam after a shower", sensor: "Humidity", actuator: "Fan", loop: "humidity above the stored value → microprocessor switches the fan on" },
  { place: "Car", goal: "Beep faster when reversing close to a wall", sensor: "Proximity", actuator: "Buzzer", loop: "distance below the stored value → microprocessor beeps the buzzer faster" },
  { place: "Kitchen", goal: "Warn people about a gas leak", sensor: "Gas", actuator: "Buzzer", loop: "gas level above the stored value → microprocessor sounds the buzzer" },
  { place: "Fish tank", goal: "Keep the water at the right acidity", sensor: "pH", actuator: "Water pump", loop: "pH outside the stored range → microprocessor pumps in treated water" },
  { place: "Office", goal: "Keep the room cool in summer", sensor: "Temperature", actuator: "Fan", loop: "temperature above the stored value → microprocessor switches the air-con fan on" },
  { place: "Classroom", goal: "Turn the lights off when nobody is there", sensor: "Infrared", actuator: "Lamp", loop: "no movement for a while → microprocessor switches the lights off" },
  { place: "Factory", goal: "Stop a tank of liquid overflowing", sensor: "Level", actuator: "Valve", loop: "level above the stored value → microprocessor closes the inlet valve" },
  { place: "Farm field", goal: "Water crops only when the ground is dry", sensor: "Moisture", actuator: "Valve", loop: "moisture below the stored value → microprocessor opens the sprinkler valve" },
  { place: "Nightclub", goal: "Warn when the music is too loud", sensor: "Acoustic", actuator: "Lamp", loop: "sound level above the stored value → microprocessor flashes a warning light" },
];
const SENSORS = ["Temperature", "Moisture", "Light", "Infrared", "Pressure", "Humidity", "Proximity", "Gas", "pH", "Level", "Acoustic"];
const ACTUATORS = ["Heater", "Water pump", "Lamp", "Siren", "Motor", "Fan", "Buzzer", "Valve"];
const ROUND = 10, WIN = 8, LIVES = 3;

const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const optionsFor = (right: string, pool: string[]) => shuffle([right, ...shuffle(pool.filter((x) => x !== right)).slice(0, 3)]);

export function ControlRoom() {
  const [phase, setPhase] = useState<"start" | "play" | "done">("start");
  const [deck, setDeck] = useState<(Sc & { sOpts: string[]; aOpts: string[] })[]>([]);
  const [i, setI] = useState(0);
  const [pickS, setPickS] = useState<string | null>(null);
  const [pickA, setPickA] = useState<string | null>(null);
  const [result, setResult] = useState<null | { good: boolean; text: string }>(null);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const sc = deck[i];

  const begin = () => {
    unlock(); sfx("round");
    setDeck(shuffle(SCENARIOS).slice(0, ROUND).map((s) => ({ ...s, sOpts: optionsFor(s.sensor, SENSORS), aOpts: optionsFor(s.actuator, ACTUATORS) })));
    setI(0); setPickS(null); setPickA(null); setResult(null); setCorrect(0); setLives(LIVES); setScore(0); setStreak(0); setLessons([]); setPhase("play");
  };

  function check(s: string, a: string) {
    const okS = s === sc.sensor, okA = a === sc.actuator;
    if (okS && okA) {
      const st = streak + 1;
      setStreak(st); setCorrect((c) => c + 1); setScore((x) => x + 100 + Math.min(st, 10) * 15); sfx("correct");
      setResult({ good: true, text: `[OK] ${sc.sensor} sensor → microprocessor → ${sc.actuator}. ${sc.loop}.` });
    } else {
      const nl = lives - 1;
      setLives(nl); setStreak(0); sfx("wrong");
      const why = `${sc.place}: ${sc.goal.toLowerCase()} needs a ${sc.sensor.toLowerCase()} sensor and a ${sc.actuator.toLowerCase()} (${sc.loop})`;
      setResult({ good: false, text: `[X] ${!okS ? `Sensor should be ${sc.sensor}. ` : ""}${!okA ? `Actuator should be ${sc.actuator}. ` : ""}${sc.loop}.` });
      setLessons((l) => [...l, { wrong: `${s} + ${a} for "${sc.goal}"`, why }]);
    }
  }
  const choose = (kind: "s" | "a", v: string) => {
    if (result) return;
    if (kind === "s") { setPickS(v); sfx("lock"); if (pickA) check(v, pickA); }
    else { setPickA(v); sfx("lock"); if (pickS) check(pickS, v); }
  };
  const next = () => {
    if (lives <= 0 || i + 1 >= deck.length) { setPhase("done"); return; }
    setI((n) => n + 1); setPickS(null); setPickA(null); setResult(null);
  };

  if (phase === "start") return (
    <StartScreen title="CONTROL ROOM" emoji="🎛️" onStart={begin}
      how={[
        "Each automated system needs an INPUT and an OUTPUT. Read the scenario.",
        "Pick the SENSOR that measures what matters (the input).",
        "Pick the ACTUATOR that does the job (the output). The microprocessor sits in between.",
        `${ROUND} systems, ${LIVES} lives. One wrong pick costs a life.`,
      ]}
      goal={`build at least ${WIN} of ${ROUND} systems correctly`}
      tips={[
        "Ask: what CHANGES in this scenario? Heat → temperature. Wet/dry soil → moisture. Movement → infrared. Weight → pressure.",
        "Actuators MOVE or CHANGE things: motors, pumps, valves, fans, heaters, lamps, buzzers.",
        "Exam answers follow the loop: sensor reads → (ADC converts) → microprocessor compares with a stored value → signal to the actuator → repeat.",
        "A sensor never 'decides': the microprocessor does.",
      ]}
      extra={<div className="rounded bg-surface2 p-2 text-left text-xs"><b>Automated system</b> = sensors (input) + microprocessor (process) + actuators (output), working with no human input.</div>} />
  );
  if (phase === "done") return (
    <ResultScreen game="control-room" success={lives > 0 && correct >= WIN} celebrate={lives > 0 && correct === deck.length} score={score} onAgain={() => setPhase("start")} lessons={lessons}
      stats={[{ label: "Built", value: `${correct}/${deck.length}` }, { label: "Score", value: String(score) }, { label: "Lives", value: String(Math.max(0, lives)) }]}
      winText={correct === deck.length ? "Every system built perfectly. You think like a control engineer." : `Systems online with ${deck.length - correct} wrong. Check the lessons below.`}
      loseText={lives <= 0 ? "Out of lives! Read the lessons: sensor = what changes, actuator = what moves." : `You built ${correct}, you needed ${WIN}.`} />
  );

  // plain function (not a component) so nothing remounts between renders
  const Pick = ({ kind, opts, picked, right }: { kind: "s" | "a"; opts: string[]; picked: string | null; right: string }) => (
    <div className="grid grid-cols-2 gap-2">
      {opts.map((o) => (
        <button key={o} disabled={!!result} onClick={() => choose(kind, o)}
          className={cn("btn h-auto py-3 normal-case", picked === o ? "ring-2 ring-accent" : "btn-ghost",
            result && o === right && "!border-good !bg-good/15", result && picked === o && o !== right && "!border-bad !bg-bad/15")}>{o}</button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 font-mono text-sm font-bold">
        <span className="chip">SYS {i + 1}/{deck.length}</span>
        <span className={cn("chip", streak >= 3 && "text-warn")}>streak {streak}</span>
        <span className="chip">OK {correct}/{WIN}</span>
        <span className="chip">LIVES {"#".repeat(Math.max(0, lives))}{"-".repeat(LIVES - Math.max(0, lives))}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card space-y-3">
          <div>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted">[{sc.place}]</div>
            <div className="font-display text-2xl">{sc.goal}</div>
          </div>
          {/* the loop, filling in as they pick */}
          <div className="flex items-center justify-between gap-1 rounded bg-surface2 p-2 text-center font-mono text-xs font-bold sm:text-sm">
            <span className={cn("flex-1 rounded border-2 px-1 py-2", pickS ? "border-accent" : "border-dashed border-line text-muted")}>{pickS ? `${pickS} sensor` : "SENSOR ?"}</span>
            <span>→</span>
            <span className="flex-1 rounded border-2 border-line px-1 py-2">micro-<br />processor</span>
            <span>→</span>
            <span className={cn("flex-1 rounded border-2 px-1 py-2", pickA ? "border-accent" : "border-dashed border-line text-muted")}>{pickA || "ACTUATOR ?"}</span>
          </div>
          <div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">1 · Sensor (input)</div>{Pick({ kind: "s", opts: sc.sOpts, picked: pickS, right: sc.sensor })}</div>
          <div><div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">2 · Actuator (output)</div>{Pick({ kind: "a", opts: sc.aOpts, picked: pickA, right: sc.actuator })}</div>
        </motion.div>
      </AnimatePresence>
      {result && (
        <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("space-y-2 rounded-lg border-2 px-3 py-2 text-sm font-bold", result.good ? "border-good bg-good/10" : "border-bad bg-bad/10")}>
          <div>{result.text}</div>
          <button className="btn btn-primary w-full" onClick={next}>{lives <= 0 || i + 1 >= deck.length ? "See results" : "Next system →"}</button>
        </motion.div>
      )}
      <CheatSheet items={["sensor = INPUT (measures)", "microprocessor = PROCESS (compares)", "actuator = OUTPUT (moves/changes)", "loop repeats forever"]} />
    </div>
  );
}
