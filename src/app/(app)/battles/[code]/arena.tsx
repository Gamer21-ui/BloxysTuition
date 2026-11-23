"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Crown, Swords, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { Confetti } from "@/components/confetti";
import type { Card as PCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { announceBattle } from "../actions";

type Battle = {
  status: "lobby" | "live" | "finished" | "cancelled"; phase: "question" | "reveal"; current_round: number; round_count: number;
  round_seconds: number; phase_started_at: string | null; winner_team: number | null; host_id: string;
};
type Player = { user_id: string; team: number; score: number };
type Answer = { round_no: number; user_id: string; choice: number | null; correct: boolean | null; points: number };
type Q = { round: number; id: string; prompt: string; options: string[]; correct: number | null };

const LETTERS = ["A", "B", "C", "D", "E"];

export function Arena({ battleId, code, mode, courseTitle, meId }: { battleId: string; code: string; mode: "1v1" | "2v2"; courseTitle: string; meId: string }) {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [b, setB] = useState<Battle | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [cards, setCards] = useState<Record<string, PCard>>({});
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [q, setQ] = useState<Q | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const phaseSeen = useRef<{ key: string; at: number }>({ key: "", at: Date.now() });
  const qKey = useRef("");
  const announced = useRef(false);
  const cap = mode === "1v1" ? 1 : 2;
  const amPlayer = players.some((p) => p.user_id === meId);
  const myTeam = players.find((p) => p.user_id === meId)?.team;

  const refresh = useCallback(async () => {
    const [{ data: bb }, { data: pp }, { data: aa }] = await Promise.all([
      sb.from("battles").select("status, phase, current_round, round_count, round_seconds, phase_started_at, winner_team, host_id").eq("id", battleId).single(),
      sb.from("battle_players").select("user_id, team, score").eq("battle_id", battleId).order("joined_at"),
      sb.from("battle_answers").select("round_no, user_id, choice, correct, points").eq("battle_id", battleId),
    ]);
    if (bb) {
      setB(bb as Battle);
      const key = `${bb.current_round}:${bb.phase}`;
      if (key !== phaseSeen.current.key) phaseSeen.current = { key, at: Date.now() };
      if (bb.status !== "lobby" && bb.current_round > 0 && key !== qKey.current) {
        qKey.current = key;
        const { data: qq } = await sb.rpc("battle_question", { p_battle: battleId });
        if (qq) setQ(qq as Q);
      }
    }
    if (pp) setPlayers(pp);
    if (aa) setAnswers(aa as Answer[]);
  }, [sb, battleId]);

  // profile cards for everyone in the battle
  useEffect(() => {
    const missing = players.map((p) => p.user_id).filter((id) => !cards[id]);
    if (!missing.length) return;
    sb.rpc("profile_cards", { p_ids: missing }).then(({ data }) => {
      if (data) setCards((c) => ({ ...c, ...Object.fromEntries((data as PCard[]).map((x) => [x.id, x])) }));
    });
  }, [players, cards, sb]);

  // realtime + polling (the poll also drives the round timer on the server)
  useEffect(() => {
    refresh();
    const ch = sb.channel("battle:" + battleId)
      .on("postgres_changes", { event: "*", schema: "public", table: "battles", filter: `id=eq.${battleId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_players", filter: `battle_id=eq.${battleId}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "battle_answers", filter: `battle_id=eq.${battleId}` }, refresh)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, battleId, refresh]);

  useEffect(() => {
    const t = setInterval(async () => {
      setNow(Date.now());
      if (!b) return;
      if (b.status === "live" && amPlayer) await sb.rpc("tick_battle", { p_battle: battleId });
      if (b.status === "live" || b.status === "lobby") refresh();
    }, 1000);
    return () => clearInterval(t);
  }, [b, amPlayer, sb, battleId, refresh]);

  useEffect(() => {
    if (b?.status === "finished" && amPlayer && !announced.current) {
      announced.current = true;
      announceBattle(battleId).catch(() => {});
      router.refresh();
    }
  }, [b?.status, amPlayer, battleId, router]);

  async function rpc(fn: string, args: Record<string, unknown>) {
    setErr(null);
    const { error } = await sb.rpc(fn, args);
    if (error) setErr(error.message);
    refresh();
  }
  async function rematch() {
    const { data, error } = await sb.rpc("create_battle", { p_mode: mode, p_course: null, p_rounds: b?.round_count || 5 });
    if (error) return setErr(error.message);
    router.push(`/battles/${data}`);
  }

  if (!b) return <div className="card py-16 text-center text-muted">Loading arena…</div>;

  const team = (t: number) => players.filter((p) => p.team === t);
  const teamScore = (t: number) => team(t).reduce((s, p) => s + p.score, 0);
  const curAnswers = answers.filter((a) => a.round_no === b.current_round);
  const mine = curAnswers.find((a) => a.user_id === meId);
  const reveal = b.phase === "reveal";
  const left = Math.max(0, b.round_seconds - (now - phaseSeen.current.at) / 1000);
  const name = (id: string) => cards[id]?.display_name || "Player";

  const PlayerTile = ({ p, side }: { p: Player; side: 1 | 2 }) => {
    const c = cards[p.user_id];
    const a = curAnswers.find((x) => x.user_id === p.user_id);
    const won = b.status === "finished" && b.winner_team === p.team;
    return (
      <div className={cn("card relative flex items-center gap-3 p-3", side === 2 && "flex-row-reverse text-right", p.user_id === meId && "ring-2 ring-accent")}>
        {won && <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 text-xp" size={22} fill="currentColor" />}
        <Avatar name={c?.display_name || "?"} mode={(c?.avatar_mode as PCard["avatar_mode"]) || "discord"} discordUrl={c?.discord_avatar_url} robloxUrl={c?.roblox_headshot_url} blocky={c?.blocky} size={52} frame={c?.frame} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold"><NameTag name={c?.display_name || "…"} style={c?.name_style} /></div>
          <div className="text-xs text-muted">Lv {c?.level ?? "?"} {p.user_id === b.host_id && "· host"}</div>
        </div>
        <div className="font-display text-2xl tabular-nums">{p.score}</div>
        <AnimatePresence>
          {b.status === "live" && !reveal && a && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="chip absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface text-xs">locked in</motion.span>
          )}
          {b.status === "live" && reveal && (
            <motion.span key="pts" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 rounded px-2 text-sm font-bold text-white", a?.correct ? "bg-good" : "bg-bad")}>
              {a?.correct ? `+${a.points}` : a ? "wrong" : "no answer"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const TeamCol = ({ t }: { t: 1 | 2 }) => (
    <div className="space-y-3">
      <div className={cn("flex items-baseline justify-between", t === 2 && "flex-row-reverse")}>
        <span className={cn("font-display text-lg", t === 1 ? "text-accent" : "text-bad")}>Team {t === 1 ? "Blue" : "Red"}</span>
        <span className="font-display text-3xl tabular-nums">{teamScore(t)}</span>
      </div>
      {team(t).map((p) => <PlayerTile key={p.user_id} p={p} side={t} />)}
      {b.status === "lobby" && Array.from({ length: cap - team(t).length }).map((_, i) => (
        <div key={i} className="card grid h-[76px] place-items-center border-dashed text-muted">
          {amPlayer && myTeam !== t ? <button className="btn btn-ghost btn-sm" onClick={() => rpc("join_battle", { p_code: code, p_team: t })}>Switch here</button>
            : !amPlayer ? <button className="btn btn-primary btn-sm" onClick={() => rpc("join_battle", { p_code: code, p_team: t })}>Join</button> : "waiting…"}
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      {b.status === "finished" && myTeam && b.winner_team === myTeam && <Confetti count={60} />}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/battles" className="text-sm text-muted hover:underline">← Battles</Link>
          <h1 className="page-title mb-0 flex items-center gap-2"><Swords /> {mode} · {courseTitle}</h1>
        </div>
        <button className="chip font-display text-lg tracking-[0.25em]" onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {code} {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      {/* skin.club-style split arena */}
      <div className="grid items-start gap-4 md:grid-cols-[1fr_auto_1fr]">
        <TeamCol t={1} />
        <div className="grid place-items-center self-center py-2">
          <motion.div animate={b.status === "live" ? { scale: [1, 1.12, 1] } : {}} transition={{ repeat: Infinity, duration: 1.6 }}
            className="grid h-16 w-16 place-items-center rounded-full bg-primary font-display text-2xl text-primary-ink shadow-chunky">VS</motion.div>
        </div>
        <TeamCol t={2} />
      </div>

      {/* round strip */}
      {b.status !== "lobby" && amPlayer && (
        <div className="mt-6 overflow-x-auto">
          <div className="flex gap-2">
            {Array.from({ length: b.round_count }, (_, i) => i + 1).map((r) => {
              const done = r < b.current_round || (r === b.current_round && reveal) || b.status === "finished";
              const ra = answers.filter((a) => a.round_no === r);
              const tw = (t: number) => ra.filter((a) => team(t).some((p) => p.user_id === a.user_id)).reduce((s, a) => s + a.points, 0);
              const w = !done ? 0 : tw(1) > tw(2) ? 1 : tw(2) > tw(1) ? 2 : 0;
              return (
                <div key={r} className={cn("card min-w-[72px] flex-1 p-2 text-center text-xs", r === b.current_round && b.status === "live" && "ring-2 ring-xp")}>
                  <div className="text-muted">R{r}</div>
                  {done ? <div className={cn("font-bold", w === 1 ? "text-accent" : w === 2 ? "text-bad" : "text-muted")}>{tw(1)} : {tw(2)}</div> : <div className="font-display">?</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* centre stage */}
      <div className="mt-6">
        {b.status === "lobby" && (
          <div className="card text-center">
            <p className="text-muted">Share the code <b className="text-ink">{code}</b> in Discord. {mode === "2v2" ? "Up to 2 per team." : "One each."} The host starts when both sides have someone.</p>
            <div className="mt-4 flex justify-center gap-3">
              {b.host_id === meId && <button className="btn btn-primary" disabled={team(1).length === 0 || team(2).length === 0} onClick={() => rpc("start_battle", { p_battle: battleId })}>Start battle</button>}
              {amPlayer && <button className="btn btn-ghost" onClick={async () => { await rpc("leave_battle", { p_battle: battleId }); router.push("/battles"); }}>{b.host_id === meId ? "Cancel lobby" : "Leave"}</button>}
            </div>
          </div>
        )}

        {b.status === "live" && amPlayer && q && (
          <div className="card">
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>Round {q.round} / {b.round_count}</span>
              <span className={cn("font-display text-lg tabular-nums", !reveal && left < 6 && "text-bad")}>{reveal ? "Reveal" : `${Math.ceil(left)}s`}</span>
            </div>
            <div className="bar mb-4"><i style={{ width: `${reveal ? 100 : (left / b.round_seconds) * 100}%`, background: reveal ? "rgb(var(--muted))" : "rgb(var(--xp))", transition: "width 1s linear" }} /></div>
            <AnimatePresence mode="wait">
              <motion.div key={q.round} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <h2 className="mb-4 text-xl">{q.prompt}</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, i) => {
                    const picked = mine?.choice === i;
                    const isRight = reveal && q.correct === i;
                    const isWrong = reveal && picked && q.correct !== i;
                    const who = reveal ? curAnswers.filter((a) => a.choice === i) : [];
                    return (
                      <button key={i} disabled={!!mine || reveal} onClick={() => rpc("answer_battle", { p_battle: battleId, p_choice: i })}
                        className={cn("btn btn-ghost h-auto justify-start gap-3 py-3 text-left normal-case",
                          picked && !reveal && "ring-2 ring-accent", isRight && "!border-good !bg-good/15", isWrong && "!border-bad !bg-bad/15")}>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-surface2 font-bold">{isRight ? <Check size={16} /> : isWrong ? <X size={16} /> : LETTERS[i]}</span>
                        <span className="flex-1">{o}</span>
                        {who.length > 0 && <span className="flex -space-x-2">{who.map((a) => (
                          <Avatar key={a.user_id} name={name(a.user_id)} mode={(cards[a.user_id]?.avatar_mode as PCard["avatar_mode"]) || "discord"} discordUrl={cards[a.user_id]?.discord_avatar_url} robloxUrl={cards[a.user_id]?.roblox_headshot_url} blocky={cards[a.user_id]?.blocky} size={24} />
                        ))}</span>}
                      </button>
                    );
                  })}
                </div>
                {!reveal && mine && <p className="mt-3 text-center text-sm text-muted">Locked in. Waiting for the others…</p>}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        {b.status === "live" && !amPlayer && <div className="card text-center text-muted">Battle in progress. Spectators see the scores only.</div>}

        {b.status === "finished" && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card text-center">
            <div className="font-display text-4xl">
              {b.winner_team === 0 ? "🤝 Draw!" : myTeam ? (b.winner_team === myTeam ? "🏆 Victory!" : "💀 Defeat") : `Team ${b.winner_team === 1 ? "Blue" : "Red"} wins!`}
            </div>
            <p className="mt-1 text-muted">{teamScore(1)} – {teamScore(2)} · XP added to your profile (5 rewarded battles a day)</p>
            <div className="mt-4 flex justify-center gap-3">
              <button className="btn btn-primary" onClick={rematch}>New lobby</button>
              <Link className="btn btn-ghost" href="/battles">Back</Link>
            </div>
          </motion.div>
        )}
        {b.status === "cancelled" && <div className="card text-center text-muted">This lobby was closed. <Link className="underline" href="/battles">Find another</Link></div>}
        {err && <p className="mt-3 text-center text-sm text-bad" role="alert">{err}</p>}
      </div>
    </div>
  );
}
