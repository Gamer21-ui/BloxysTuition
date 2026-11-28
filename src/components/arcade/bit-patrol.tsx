"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sfx, unlock } from "@/lib/battle-audio";
import { cn } from "@/lib/utils";
import { CheatSheet, ResultScreen, StartScreen, type Lesson } from "./shared";

/**
 * Topic 2 · data transmission. Three kinds of round:
 *  CHECK: a byte arrives (parity bit on the left). Accept it or reject it as corrupted.
 *  SET:   7 data bits are about to be sent. Choose the parity bit.
 *  NAME:  a description of a method (error detection, serial/parallel, duplex, encryption). Name it.
 */
type Parity = "even" | "odd";
type Round =
  | { kind: "check"; parity: Parity; bits: number[]; ok: boolean; flipped: number }
  | { kind: "set"; parity: Parity; data: number[]; answer: number }
  | { kind: "name"; text: string; answer: string; options: string[] };

const FAMILIES: { members: { name: string; text: string }[] }[] = [
  { members: [
    { name: "Parity check", text: "An extra bit is added so the total number of 1s is even (or odd)." },
    { name: "Checksum", text: "A value is calculated from a block of data, sent with it, then recalculated by the receiver and compared." },
    { name: "Echo check", text: "The receiver sends the data straight back to the sender, who compares it with the original." },
    { name: "ARQ", text: "The receiver sends an acknowledgement. If none arrives before the timeout, the sender sends the data again." },
    { name: "Check digit", text: "The last digit of a barcode or ISBN is calculated from the other digits, so typing errors can be found." },
    { name: "Parity block", text: "Parity is checked on every row AND column of a block, so the exact bit that flipped can be found." },
  ] },
  { members: [
    { name: "Serial", text: "Bits are sent one at a time, one after another, down a single wire." },
    { name: "Parallel", text: "Several bits are sent at the same time down several wires. Only reliable over short distances." },
    { name: "Simplex", text: "Data can only travel in one direction (e.g. a computer sending to a printer)." },
    { name: "Half-duplex", text: "Data can travel both ways, but only one direction at a time (like a walkie-talkie)." },
    { name: "Full-duplex", text: "Data travels in both directions at the same time (like a phone call)." },
  ] },
  { members: [
    { name: "Symmetric encryption", text: "The SAME key is used to encrypt and to decrypt the message." },
    { name: "Asymmetric encryption", text: "A public key encrypts the message and only the matching private key can decrypt it." },
    { name: "Packet switching", text: "Data is split into packets that may take different routes and are put back in order at the destination." },
    { name: "USB", text: "A standard serial connection: devices are recognised automatically and it only fits one way." },
  ] },
];
const ROUND_PLAN: Round["kind"][] = ["check", "check", "set", "name", "check", "name", "set", "check", "name", "check", "set", "name", "check", "name", "name"];
const WIN = 12, LIVES = 3;

const rnd = (n: number) => Math.floor(Math.random() * n);
const shuffle = <T,>(a: T[]) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const ones = (b: number[]) => b.filter((x) => x === 1).length;
const parityBit = (data: number[], p: Parity) => (p === "even" ? ones(data) % 2 : (ones(data) + 1) % 2);

function makeRounds(): Round[] {
  const names = shuffle(FAMILIES.flatMap((f) => f.members.map((m) => ({ ...m, family: f }))));
  let ni = 0;
  return ROUND_PLAN.map((kind) => {
    const parity: Parity = Math.random() < 0.5 ? "even" : "odd";
    const data = Array.from({ length: 7 }, () => rnd(2));
    if (kind === "set") return { kind, parity, data, answer: parityBit(data, parity) };
    if (kind === "check") {
      const bits = [parityBit(data, parity), ...data];
      const ok = Math.random() < 0.5;
      const flipped = ok ? -1 : rnd(8);
      if (!ok) bits[flipped] = 1 - bits[flipped];
      return { kind, parity, bits, ok, flipped };
    }
    const m = names[ni++ % names.length];
    const others = shuffle(m.family.members.filter((x) => x.name !== m.name)).slice(0, 3).map((x) => x.name);
    return { kind: "name", text: m.text, answer: m.name, options: shuffle([m.name, ...others]) };
  });
}

const Bits = ({ bits, flip, showParity }: { bits: number[]; flip?: number; showParity?: boolean }) => (
  <div className="flex justify-center gap-1 font-mono">
    {bits.map((b, k) => (
      <span key={k} className={cn("grid h-10 w-8 place-items-center rounded border-2 text-xl font-bold sm:h-12 sm:w-10",
        k === 0 && showParity ? "border-xp bg-xp/15" : "border-line bg-surface2", flip === k && "!border-bad !bg-bad/20")}>{b}</span>
    ))}
  </div>
);

export function BitPatrol() {
  const [phase, setPhase] = useState<"start" | "play" | "done">("start");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [i, setI] = useState(0);
  const [res, setRes] = useState<null | { good: boolean; text: string }>(null);
  const [correct, setCorrect] = useState(0);
  const [lives, setLives] = useState(LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const r = rounds[i];

  const begin = () => { unlock(); sfx("round"); setRounds(makeRounds()); setI(0); setRes(null); setCorrect(0); setLives(LIVES); setScore(0); setStreak(0); setLessons([]); setPhase("play"); };

  function mark(good: boolean, text: string, lesson: Lesson) {
    if (good) { const s = streak + 1; setStreak(s); setCorrect((c) => c + 1); setScore((x) => x + 100 + Math.min(s, 10) * 15); sfx("correct"); }
    else { setLives((l) => l - 1); setStreak(0); setLessons((l) => [...l, lesson]); sfx("wrong"); }
    setRes({ good, text });
  }
  function answer(v: string | number | boolean) {
    if (res || !r) return;
    if (r.kind === "check") {
      const n = ones(r.bits);
      const why = `${n} ones in total: ${n % 2 === 0 ? "even" : "odd"}, and the agreed parity is ${r.parity}, so it ${r.ok ? "is fine" : "was corrupted"}${r.ok ? "" : ` (bit ${r.flipped + 1} flipped)`}`;
      mark(v === r.ok, `${v === r.ok ? "[OK]" : "[X]"} ${why}.`, { wrong: `Byte ${r.bits.join("")} (${r.parity} parity)`, why });
    } else if (r.kind === "set") {
      const n = ones(r.data);
      const why = `the data has ${n} ones, so the parity bit must be ${r.answer} to make the total ${r.parity}`;
      mark(v === r.answer, `${v === r.answer ? "[OK]" : "[X]"} ${why.charAt(0).toUpperCase() + why.slice(1)}.`, { wrong: `Parity bit for ${r.data.join("")} (${r.parity})`, why });
    } else {
      mark(v === r.answer, `${v === r.answer ? "[OK]" : "[X]"} ${r.answer}: ${r.text}`, { wrong: String(v), why: `${r.answer}: ${r.text}` });
    }
  }
  const next = () => {
    if (lives <= 0 || i + 1 >= rounds.length) { setPhase("done"); return; }
    setI((n) => n + 1); setRes(null);
  };

  if (phase === "start") return (
    <StartScreen title="BIT PATROL" emoji="📡" onStart={begin}
      how={[
        "You guard a data link. Three kinds of round:",
        "CHECK: a byte arrives with its parity bit on the left. Accept it, or reject it as corrupted.",
        "SET: choose the parity bit before 7 data bits are sent.",
        "NAME: read a description and name the method (error checks, serial/parallel, duplex, encryption…).",
        `${ROUND_PLAN.length} rounds, ${LIVES} lives.`,
      ]}
      goal={`get at least ${WIN} of ${ROUND_PLAN.length} right`}
      tips={[
        "Count the 1s in the WHOLE byte (parity bit included). Even parity → the count must be even.",
        "To SET the bit: count the 1s in the data. If it's already right for the parity, the bit is 0; if not, it's 1.",
        "A parity check can't tell WHICH bit flipped, and misses two flipped bits. A parity block can find it.",
        "Echo = sent back and compared. Checksum = a calculated value compared. ARQ = acknowledgement + timeout.",
      ]}
      extra={<div className="rounded bg-surface2 p-2 text-left font-mono text-xs"><b>Even parity example:</b> 1 0110100<br />count the 1s: 1+0+1+1+0+1+0+0 = 4 → even → ACCEPT</div>} />
  );
  if (phase === "done") return (
    <ResultScreen game="bit-patrol" success={lives > 0 && correct >= WIN} celebrate={lives > 0 && correct === rounds.length} score={score} onAgain={() => setPhase("start")} lessons={lessons}
      stats={[{ label: "Right", value: `${correct}/${rounds.length}` }, { label: "Score", value: String(score) }, { label: "Lives", value: String(Math.max(0, lives)) }]}
      winText={correct === rounds.length ? "Perfect patrol: not one corrupted bit got past you." : `Link secured, with ${rounds.length - correct} slip${rounds.length - correct === 1 ? "" : "s"}. Check the lessons below.`}
      loseText={lives <= 0 ? "Out of lives! Read the lessons, count the 1s carefully, and try again." : `You got ${correct}, you needed ${WIN}.`} />
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 font-mono text-sm font-bold">
        <span className="chip">RND {i + 1}/{rounds.length}</span>
        <span className={cn("chip", streak >= 3 && "text-warn")}>streak {streak}</span>
        <span className="chip">OK {correct}/{WIN}</span>
        <span className="chip">LIVES {"#".repeat(Math.max(0, lives))}{"-".repeat(LIVES - Math.max(0, lives))}</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4 text-center">
          {r.kind === "check" && (<>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted">[ incoming byte · {r.parity} parity ]</div>
            {Bits({ bits: r.bits, showParity: true, flip: res && !r.ok ? r.flipped : undefined })}
            <div className="text-xs text-muted">The highlighted left bit is the parity bit.</div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={!!res} onClick={() => answer(true)} className="btn h-auto border-good bg-good/15 py-4 font-mono text-lg">ACCEPT</button>
              <button disabled={!!res} onClick={() => answer(false)} className="btn h-auto border-bad bg-bad/15 py-4 font-mono text-lg">REJECT</button>
            </div>
          </>)}
          {r.kind === "set" && (<>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted">[ outgoing data · {r.parity} parity ]</div>
            <div className="flex items-center justify-center gap-2">
              <span className="grid h-10 w-8 place-items-center rounded border-2 border-dashed border-xp font-mono text-xl font-bold sm:h-12 sm:w-10">{res ? r.answer : "?"}</span>
              {Bits({ bits: r.data })}
            </div>
            <div className="text-sm font-bold">What must the parity bit be?</div>
            <div className="grid grid-cols-2 gap-3">
              {[0, 1].map((b) => <button key={b} disabled={!!res} onClick={() => answer(b)} className="btn btn-ghost h-auto py-4 font-mono text-2xl">{b}</button>)}
            </div>
          </>)}
          {r.kind === "name" && (<>
            <div className="font-mono text-xs font-bold uppercase tracking-widest text-muted">[ name the method ]</div>
            <p className="text-lg font-bold">{r.text}</p>
            <div className="grid grid-cols-2 gap-2">
              {r.options.map((o) => (
                <button key={o} disabled={!!res} onClick={() => answer(o)}
                  className={cn("btn btn-ghost h-auto py-3 normal-case", res && o === r.answer && "!border-good !bg-good/15")}>{o}</button>
              ))}
            </div>
          </>)}
        </motion.div>
      </AnimatePresence>
      {res && (
        <motion.div initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={cn("space-y-2 rounded-lg border-2 px-3 py-2 text-sm font-bold", res.good ? "border-good bg-good/10" : "border-bad bg-bad/10")}>
          <div>{res.text}</div>
          <button className="btn btn-primary w-full" onClick={next}>{lives <= 0 || i + 1 >= rounds.length ? "See results" : "Next →"}</button>
        </motion.div>
      )}
      <CheatSheet items={["count ALL the 1s", "even parity → even count", "parity misses 2 flipped bits", "echo · checksum · ARQ · check digit"]} />
    </div>
  );
}
