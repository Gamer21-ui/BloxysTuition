"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card, SectionTitle } from "@/components/ui";
import { PollBars, type Poll } from "@/components/live-poll";
import { cn } from "@/lib/utils";

type Vote = { user_id: string; choice: number };

export function PollsDesk({ initial, students }: { initial: Poll[]; students: { id: string; display_name: string }[] }) {
  const sb = useMemo(() => createClient(), []);
  const [polls, setPolls] = useState<Poll[]>(initial);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState(["", ""]);
  const [correct, setCorrect] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const live = polls.find((p) => p.status === "open") || null;
  const liveId = useRef<string | null>(null);
  liveId.current = live?.id ?? null;
  const name = (id: string) => students.find((s) => s.id === id)?.display_name || "Someone";

  // live tally + who voted
  useEffect(() => {
    const ch = sb.channel("polls-desk")
      .on("postgres_changes", { event: "*", schema: "public", table: "polls" }, ({ new: row, eventType }) => {
        const p = row as Poll;
        setPolls((ps) => (eventType === "INSERT" ? [p, ...ps.filter((x) => x.id !== p.id)] : ps.map((x) => (x.id === p.id ? p : x))));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, ({ new: row }) => {
        const v = row as Vote & { poll_id: string };
        if (!v?.poll_id) return;
        setVotes((vs) => (v.poll_id === liveId.current ? [...vs.filter((x) => x.user_id !== v.user_id), { user_id: v.user_id, choice: v.choice }] : vs));
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb]);
  useEffect(() => {
    if (!live) return setVotes([]);
    sb.from("poll_votes").select("user_id, choice").eq("poll_id", live.id).then(({ data }) => setVotes(data || []));
  }, [sb, live?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function launch() {
    setBusy(true); setErr(null);
    // drop empty options and keep the ✓ pointing at the same option
    const kept = opts.map((o, i) => ({ o: o.trim(), i })).filter((x) => x.o);
    const ci = correct === null ? null : kept.findIndex((x) => x.i === correct);
    const { data, error } = await sb.rpc("create_poll", { p_question: q, p_options: kept.map((x) => x.o), p_correct: ci === null || ci < 0 ? null : ci });
    setBusy(false);
    if (error) return setErr(error.message.includes("create_poll") ? "Run the polls SQL update in Supabase first." : error.message);
    const { data: p } = await sb.from("polls").select("*").eq("id", data).single();
    if (p) setPolls((ps) => [p as Poll, ...ps.map((x) => (x.status === "open" ? { ...x, status: "closed" as const } : x)).filter((x) => x.id !== p.id)]);
    setQ(""); setOpts(["", ""]); setCorrect(null);
  }
  async function close(id: string) {
    const { error } = await sb.rpc("close_poll", { p_poll: id });
    if (error) return setErr(error.message);
    setPolls((ps) => ps.map((x) => (x.id === id ? { ...x, status: "closed" } : x)));
  }
  const quick = (o: string[]) => { setOpts(o); setCorrect(null); };
  const notVoted = students.filter((s) => !votes.some((v) => v.user_id === s.id));

  return (
    <div className="mt-5 space-y-6">
      {live && (
        <Card className="space-y-3 ring-2 ring-bad">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"><span className="h-2 w-2 animate-pulse rounded-full bg-bad" /> Live now</div>
            <button className="btn btn-primary btn-sm" onClick={() => close(live.id)}>Close poll{live.correct !== null ? " & reveal answer" : ""}</button>
          </div>
          <h2 className="font-display text-2xl">{live.question}</h2>
          <PollBars poll={live} showResults />
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="mb-1 font-bold">Voted ({votes.length})</div>
              <div className="flex flex-wrap gap-1">{votes.map((v) => <span key={v.user_id} className="chip">{name(v.user_id)} · {live.options[v.choice]}</span>)}</div>
            </div>
            <div>
              <div className="mb-1 font-bold text-muted">Not voted yet ({notVoted.length})</div>
              <div className="flex flex-wrap gap-1">{notVoted.map((s) => <span key={s.id} className="chip opacity-70">{s.display_name}</span>)}</div>
            </div>
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="text-lg">{live ? "Next poll (launching closes the current one)" : "New poll"}</h2>
        <input className="input" placeholder="Question, e.g. How confident are you with depreciation?" value={q} maxLength={300} onChange={(e) => setQ(e.target.value)} />
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="self-center text-muted">Quick:</span>
          <button className="chip py-2" onClick={() => quick(["Yes", "No"])}>Yes / No</button>
          <button className="chip py-2" onClick={() => quick(["😎 Got it", "🤔 Kind of", "😵 Lost"])}>Got it / Kind of / Lost</button>
          <button className="chip py-2" onClick={() => quick(["A", "B", "C", "D"])}>A B C D</button>
          <button className="chip py-2" onClick={() => quick(["True", "False"])}>True / False</button>
        </div>
        <div className="space-y-2">
          {opts.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <button type="button" title="Mark as the correct answer (optional)" onClick={() => setCorrect(correct === i ? null : i)}
                className={cn("grid h-9 w-9 shrink-0 place-items-center rounded border-2 text-sm font-bold", correct === i ? "border-good bg-good text-white" : "border-line text-muted")}>✓</button>
              <input className="input" placeholder={`Option ${i + 1}`} value={o} maxLength={120} onChange={(e) => setOpts(opts.map((x, k) => (k === i ? e.target.value : x)))} />
              {opts.length > 2 && <button className="p-2 text-muted hover:text-bad" aria-label="Remove option" onClick={() => { setOpts(opts.filter((_, k) => k !== i)); setCorrect(null); }}><Trash2 size={16} /></button>}
            </div>
          ))}
          {opts.length < 6 && <button className="btn btn-ghost btn-sm" onClick={() => setOpts([...opts, ""])}><Plus size={14} /> Add option</button>}
        </div>
        <p className="text-xs text-muted">Tap ✓ to mark a correct answer (optional). It&apos;s revealed to everyone when you close the poll, which turns it into a quick quiz question.</p>
        <button className="btn btn-primary w-full" disabled={busy || q.trim().length < 2 || opts.filter((o) => o.trim()).length < 2} onClick={launch}>
          {busy ? "Launching…" : "🚀 Launch poll to everyone"}
        </button>
        {err && <p className="text-sm font-bold text-bad" role="alert">{err}</p>}
      </Card>

      {polls.some((p) => p.status === "closed") && (
        <>
          <SectionTitle>Past polls</SectionTitle>
          <div className="space-y-3">
            {polls.filter((p) => p.status === "closed").map((p) => (
              <details key={p.id} className="card">
                <summary className="cursor-pointer font-bold">{p.question} <span className="font-normal text-muted">· {p.counts.reduce((a, b) => a + b, 0)} votes · {new Date(p.created_at).toLocaleDateString("en-GB")}</span></summary>
                <div className="mt-3"><PollBars poll={p} showResults /></div>
              </details>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
