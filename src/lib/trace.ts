/**
 * Trace-table engine for the "Trace Master" arcade game.
 * Each program is written twice: as Cambridge-style pseudocode (what students read) and as a tiny
 * JS `run` that records every assignment/output. The trace is therefore computed, never hand-typed,
 * so the "correct" answers can't drift from the code.
 */
export type TraceStep = { line: number; name: string; value: string; ask: boolean; note?: string; wrong?: string[]; q?: string };
export type TraceProgram = { id: string; title: string; topic: string; code: string[]; vars: string[]; steps: TraceStep[]; vb?: string[] };
export type TraceSet = { key: "o" | "as" | "a" | "pro"; game: string; label: string; blurb: string; programs: TraceProgram[] };

type Val = number | string | boolean;
export const fmt = (v: Val) => (typeof v === "boolean" ? (v ? "TRUE" : "FALSE") : String(v));

export class Tracer {
  steps: TraceStep[] = [];
  constructor(private code: string[]) {}
  /** line number (1-based) of the first line containing `marker`, searching from `from`. */
  at(marker: string, from = 1) {
    const i = this.code.findIndex((l, k) => k + 1 >= from && l.includes(marker));
    if (i < 0) throw new Error(`trace marker not found: ${marker}`);
    return i + 1;
  }
  /** record `name` becoming `v` on the line containing `marker`. ask=false fills the cell automatically. */
  set(name: string, v: Val, marker: string, ask = true, note?: string, wrong?: Val[]) {
    this.steps.push({ line: this.at(marker), name, value: fmt(v), ask, note, wrong: wrong?.map(fmt) });
    return v;
  }
  out(v: Val, marker: string, ask = true) { return this.set("OUTPUT", v, marker, ask); }
  /** like set(), always asked, with a custom question (used where "Line n runs" would confuse, e.g. recursion) */
  ask(name: string, v: Val, marker: string, q: string, note?: string, wrong?: Val[]) {
    this.set(name, v, marker, true, note, wrong);
    this.steps[this.steps.length - 1].q = q;
    return v;
  }
}

export function program(def: { id: string; title: string; topic: string; code: string; vars: string[]; vb?: string; run: (t: Tracer) => void }): TraceProgram {
  const code = def.code.replace(/^\n+|\s+$/g, "").split("\n");
  const t = new Tracer(code);
  def.run(t);
  const hasOut = t.steps.some((x) => x.name === "OUTPUT");
  const vars = def.vars.includes("OUTPUT") || !hasOut ? def.vars : [...def.vars, "OUTPUT"];
  return { id: def.id, title: def.title, topic: def.topic, code, vars, steps: t.steps, vb: def.vb?.replace(/^\n+|\s+$/g, "").split("\n") };
}

/** Lay steps out as a trace table, Cambridge style: a row fills left to right; going back to a column on the left starts a new row. */
export function traceRows(vars: string[], steps: { name: string; value: string }[]) {
  const rows: string[][] = [];
  let cur: string[] = vars.map(() => ""), last = -1;
  for (const s of steps) {
    const c = vars.indexOf(s.name);
    if (c < 0) continue;
    if (c <= last) { rows.push(cur); cur = vars.map(() => ""); }
    cur[c] = s.value; last = c;
  }
  if (last >= 0) rows.push(cur);
  return rows;
}

/** Plausible wrong answers built from the trace itself (off-by-one, the old value, other variables). */
export function optionsFor(steps: TraceStep[], idx: number, seed: number) {
  const s = steps[idx];
  const correct = s.value;
  const pool = new Set<string>();
  const n = Number(correct);
  const isNum = correct !== "" && !Number.isNaN(n);
  if (correct === "TRUE" || correct === "FALSE") { pool.add(correct === "TRUE" ? "FALSE" : "TRUE"); }
  else if (isNum) {
    const prev = [...steps.slice(0, idx)].reverse().find((x) => x.name === s.name);
    if (prev && prev.value !== correct) pool.add(prev.value);
    [n + 1, n - 1, n * 2, n + 2].forEach((x) => pool.add(String(Number.isInteger(n) ? x : +x.toFixed(2))));
    steps.slice(0, idx).filter((x) => x.name !== s.name && !Number.isNaN(Number(x.value))).slice(-3).forEach((x) => pool.add(x.value));
  } else {
    const prev = [...steps.slice(0, idx)].reverse().find((x) => x.name === s.name);
    if (prev) pool.add(prev.value);
    steps.filter((x) => x.value !== correct && Number.isNaN(Number(x.value)) && x.value !== "TRUE" && x.value !== "FALSE").forEach((x) => pool.add(x.value));
    if (correct.length > 1) { pool.add(correct.slice(0, -1)); pool.add(correct.slice(1)); pool.add(correct.toLowerCase()); }
  }
  pool.delete(correct); pool.delete("");
  // deterministic shuffle so server and client agree
  let r = seed * 9301 + idx * 49297;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const forced = (s.wrong || []).filter((w) => w !== correct);
  const wrong = [...new Set([...forced, ...[...pool].sort(() => rnd() - 0.5)])].slice(0, 3);
  const all = [correct, ...wrong];
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  return all;
}
