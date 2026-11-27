"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";
import { subjectName, subjectOf } from "@/lib/subjects";
import { STYLES, type Style } from "@/lib/ranks";

type Lvl = "O" | "AS" | "A" | "ASA";
const LVL_LABEL: Record<Lvl, string> = { O: "O Level", AS: "AS Level", A: "A Level", ASA: "AS + A Level (both)" };

export function BattleLobbyForms({ courses, myTier = "O" }: { courses: { id: string; slug: string; title: string; code: string; tier: string; chapters?: { id: string; number: string; title: string; sort: number }[] }[]; myTier?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"1v1" | "2v2">("1v1");
  const [lvl, setLvl] = useState<Lvl>((myTier === "AS" || myTier === "A" ? myTier : "O") as Lvl);
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [style, setStyle] = useState<Style>("classic");
  const [rounds, setRounds] = useState(5);
  // subjects that exist at the chosen level (AS + A shows anything at either)
  const atLevel = courses.filter((c) => (lvl === "ASA" ? c.tier === "AS" || c.tier === "A" : c.tier === lvl));
  const subjects = [...new Set(atLevel.map((c) => subjectOf(c.slug)))];
  const picked = lvl !== "ASA" && subject ? atLevel.find((c) => subjectOf(c.slug) === subject) : undefined;
  const chapters = [...(picked?.chapters || [])].sort((a, b) => a.sort - b.sort);
  const levels = (["O", "AS", "A", "ASA"] as Lvl[]).filter((l) => courses.some((c) => (l === "ASA" ? c.tier === "AS" || c.tier === "A" : c.tier === l)));
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true); setErr(null);
    // one level + one subject = that course; AS + A or "all subjects" = a mixed battle
    const course = lvl !== "ASA" && subject ? atLevel.find((c) => subjectOf(c.slug) === subject)?.id || null : null;
    const args: Record<string, unknown> = {
      p_mode: mode, p_course: course, p_rounds: rounds, p_tier: course ? null : lvl === "ASA" ? "A" : lvl,
      p_subject: course ? null : subject || null, p_both: lvl === "ASA",
    };
    if (course && chapter && style !== "ranked") args.p_chapter = chapter; // only sent when picked
    if (style !== "classic") args.p_style = style;
    if (style === "ranked") args.p_rounds = Math.max(rounds, 5);
    const { data, error } = await createClient().rpc("create_battle", args);
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(`/battles/${data}`);
  }
  async function join(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(c)) return setErr("Codes are 5 letters/numbers");
    setBusy(true); setErr(null);
    const { error } = await createClient().rpc("join_battle", { p_code: c, p_team: null });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(`/battles/${c}`);
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-[1.4fr_1fr]">
      <Card className="space-y-4">
        <h2 className="text-xl">Create a battle</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Battle style">
          {(Object.keys(STYLES) as Style[]).filter((k) => k !== "duel").map((k) => (
            <button key={k} type="button" role="radio" aria-checked={style === k} onClick={() => { setStyle(k); if (k === "ranked" && rounds < 5) setRounds(5); }}
              className={cn("btn h-auto flex-col gap-0.5 py-2", style === k ? "btn-primary" : "btn-ghost")}>
              <span className="text-xl">{STYLES[k].emoji}</span><span className="text-sm">{STYLES[k].label}</span>
            </button>
          ))}
        </div>
        <p className="-mt-2 text-xs text-muted">{STYLES[style].blurb}</p>
        <div className="flex gap-2">
          {(["1v1", "2v2"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setMode(m)} className={cn("btn flex-1", mode === m ? "btn-primary" : "btn-ghost")}>{m}</button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bt">Level</label>
            <select id="bt" className="input" value={lvl} onChange={(e) => { setLvl(e.target.value as Lvl); setSubject(""); setChapter(""); }}>
              {levels.map((l) => <option key={l} value={l}>{LVL_LABEL[l]}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bc">Subject</label>
            <select id="bc" className="input" value={subject} onChange={(e) => { setSubject(e.target.value); setChapter(""); }}>
              <option value="">Mixed (all subjects)</option>
              {subjects.map((k) => <option key={k} value={k}>{subjectName(k)}</option>)}
            </select>
          </div>
          {chapters.length > 0 && style !== "ranked" && (
            <div>
              <label className="label" htmlFor="bch">Chapter</label>
              <select id="bch" className="input" value={chapter} onChange={(e) => setChapter(e.target.value)}>
                <option value="">All chapters</option>
                {chapters.map((c) => <option key={c.id} value={c.id}>{c.number} {c.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label" htmlFor="br">Rounds</label>
            <select id="br" className="input" value={rounds} onChange={(e) => setRounds(+e.target.value)}>
              {[3, 5, 7, 10].filter((n) => style !== "ranked" || n >= 5).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary w-full" disabled={busy} onClick={create}>Create lobby</button>
      </Card>
      <Card>
        <h2 className="text-xl">Join with a code</h2>
        <form onSubmit={join} className="mt-4 space-y-3">
          <input className="input text-center font-display text-2xl uppercase tracking-[0.3em]" maxLength={5} value={code}
            onChange={(e) => setCode(e.target.value)} placeholder="ABC12" aria-label="Battle code" />
          <button className="btn btn-accent w-full" disabled={busy}>Join</button>
        </form>
        {err && <p className="mt-3 text-sm text-bad" role="alert">{err}</p>}
      </Card>
    </div>
  );
}
