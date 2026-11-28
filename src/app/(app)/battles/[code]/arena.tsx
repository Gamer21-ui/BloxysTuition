"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { Check, Copy, Crown, Flame, Smile, Swords, Volume2, VolumeX, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { Confetti } from "@/components/confetti";
import type { Card as PCard } from "@/lib/types";
import { cn } from "@/lib/utils";
import { announceBattle } from "../actions";
import { playMusic, sfx, setSoundOn, soundOn, stopMusic, unlock } from "@/lib/battle-audio";
import { rankOf, STYLES } from "@/lib/ranks";
import { PrestigeBadge } from "@/components/prestige-badge";
import { bountyOf, WANTED_AT } from "@/lib/bounty";

// Emotes are sent as an index into this list, so nobody can broadcast their own text.
const EMOTES = ["👍", "😂", "😭", "🔥", "💀", "😎", "🤯", "👑", "GG", "Nice one!", "So close!", "Let's go!", "Good luck!", "Wow!"];
type Floater = { key: number; uid: string; idx: number };

type Battle = {
  status: "lobby" | "live" | "finished" | "cancelled"; phase: "question" | "reveal"; current_round: number; round_count: number;
  round_seconds: number; phase_started_at: string | null; winner_team: number | null; host_id: string;
  style?: "classic" | "ranked" | "pressure" | "duel" | "race"; phase_ends_at?: string | null;
};
type Player = { user_id: string; team: number; score: number; rating_delta?: number | null; reward_xp?: number | null };
type Answer = { round_no: number; user_id: string; choice: number | null; correct: boolean | null; points: number; order_given?: number[] | null };
type Q = { round: number; id: string; prompt: string; options: string[]; correct: number | null; ref?: string | null; guide?: string | null; explanation?: string | null; order?: number[] | null };

const LETTERS = ["A", "B", "C", "D", "E"];

export function Arena({ battleId, code, mode, courseTitle, meId }: { battleId: string; code: string; mode: "1v1" | "2v2"; courseTitle: string; meId: string }) {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [b, setB] = useState<Battle | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [cards, setCards] = useState<Record<string, PCard>>({});
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [q, setQ] = useState<Q | null>(null);
  const [streaks, setStreaks] = useState<Record<string, number>>({});   // 🎯 win streaks (bounties)
  const [bounty, setBounty] = useState<{ user_id: string; kind: string; streak: number; xp: number; coins: number; other_id: string | null }[]>([]);
  const [picked, setPicked] = useState<number[]>([]);   // Order Race: the order tapped so far
  useEffect(() => { setPicked([]); }, [q?.round, q?.id]);
  const [err, setErr] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [sound, setSound] = useState(true);
  const [banner, setBanner] = useState<{ key: string; text: string; final: boolean } | null>(null);
  const [flash, setFlash] = useState<"good" | "bad" | null>(null);
  const shaker = useAnimationControls();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [emoteOpen, setEmoteOpen] = useState(false);
  const chRef = useRef<ReturnType<typeof sb.channel> | null>(null);
  const lastEmote = useRef(0);
  const recvLog = useRef<Record<string, number[]>>({});
  const fxSeen = useRef("");
  const endSeen = useRef(false);
  const tickSeen = useRef(-1);
  const phaseSeen = useRef<{ key: string; at: number }>({ key: "", at: Date.now() });
  const qKey = useRef("");
  const announced = useRef(false);
  const cap = mode === "1v1" ? 1 : 2;
  const amPlayer = players.some((p) => p.user_id === meId);
  const myTeam = players.find((p) => p.user_id === meId)?.team;

  // ---------------------------------------------------------------- emotes
  const showEmote = useCallback((pl: { uid?: unknown; idx?: unknown }) => {
    const uid = typeof pl.uid === "string" ? pl.uid : ""; const idx = typeof pl.idx === "number" ? pl.idx : -1;
    if (!uid || idx < 0 || idx >= EMOTES.length) return;
    const now = Date.now(); const log = (recvLog.current[uid] || []).filter((t) => now - t < 5000);
    if (log.length >= 5) return; // ignore spam
    recvLog.current[uid] = [...log, now];
    const key = now + Math.random();
    setFloaters((f) => [...f.slice(-11), { key, uid, idx }]);
    sfx("emote");
    setTimeout(() => setFloaters((f) => f.filter((x) => x.key !== key)), 2600);
  }, []);
  function sendEmote(idx: number) {
    unlock();
    if (Date.now() - lastEmote.current < 1200) return;
    lastEmote.current = Date.now();
    showEmote({ uid: meId, idx });
    chRef.current?.send({ type: "broadcast", event: "emote", payload: { uid: meId, idx } });
    setEmoteOpen(false);
  }

  const refresh = useCallback(async () => {
    const [{ data: bb }, { data: pp }, { data: aa }] = await Promise.all([
      // newer columns (style, rating) need the ranked database update; fall back so battles still work without it
      sb.from("battles").select("status, phase, current_round, round_count, round_seconds, phase_started_at, winner_team, host_id, style, phase_ends_at").eq("id", battleId).single()
        .then(async (r) => (r.error ? await sb.from("battles").select("status, phase, current_round, round_count, round_seconds, phase_started_at, winner_team, host_id").eq("id", battleId).single() as unknown as typeof r : r)),
      sb.from("battle_players").select("user_id, team, score, rating_delta, reward_xp").eq("battle_id", battleId).order("joined_at")
        .then(async (r) => (r.error ? await sb.from("battle_players").select("user_id, team, score, rating_delta").eq("battle_id", battleId).order("joined_at") as unknown as typeof r : r))
        .then(async (r) => (r.error ? await sb.from("battle_players").select("user_id, team, score").eq("battle_id", battleId).order("joined_at") as unknown as typeof r : r)),
      sb.from("battle_answers").select("round_no, user_id, choice, correct, points, order_given").eq("battle_id", battleId)
        .then(async (r) => (r.error ? await sb.from("battle_answers").select("round_no, user_id, choice, correct, points").eq("battle_id", battleId) as unknown as typeof r : r)),
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

  // win streaks for wanted badges (silently skipped before the bounty update)
  const playerKey = players.map((p) => p.user_id).join(",");
  useEffect(() => {
    if (!playerKey) return;
    sb.rpc("battle_streaks", { p_battle: battleId }).then(({ data }) => {
      if (data) setStreaks(Object.fromEntries((data as { user_id: string; win_streak: number }[]).map((x) => [x.user_id, x.win_streak])));
    });
  }, [playerKey, sb, battleId]);

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
      .on("broadcast", { event: "emote" }, ({ payload }) => showEmote(payload as { uid?: unknown; idx?: unknown }))
      .subscribe();
    chRef.current = ch;
    return () => { chRef.current = null; sb.removeChannel(ch); };
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
  // bounty results arrive with the finish (the reward runs on the server first)
  useEffect(() => {
    if (b?.status !== "finished") return;
    const load = () => sb.from("bounty_events").select("user_id, kind, streak, xp, coins, other_id").eq("battle_id", battleId)
      .then(({ data, error }) => { if (!error && data) setBounty(data); });
    load(); const t = setTimeout(load, 1500);
    return () => clearTimeout(t);
  }, [b?.status, sb, battleId]);

  // ---------------------------------------------------------------- music + effects
  useEffect(() => { setSound(soundOn()); return () => stopMusic(); }, []);
  useEffect(() => {
    if (!b) return;
    if (b.status === "lobby") playMusic("lobby");
    else if (b.status === "live") playMusic(b.current_round >= b.round_count ? "final" : "battle");
    else stopMusic();
  }, [b?.status, b?.current_round, b?.round_count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!b || b.status !== "live" || !b.current_round) return;
    const key = `${b.current_round}:${b.phase}`;
    if (fxSeen.current === key) return;
    const first = fxSeen.current === "";
    fxSeen.current = key;
    if (b.phase === "question") {
      const final = b.current_round >= b.round_count;
      setBanner({ key, text: final ? "FINAL ROUND" : `ROUND ${b.current_round}`, final });
      if (!first || b.current_round === 1) sfx(final ? "final" : "round");
      setTimeout(() => setBanner((x) => (x?.key === key ? null : x)), 1300);
    }
  }, [b]);

  // pressure: someone answered, the clock just got cut
  const cutSeen = useRef<string | null>(null);
  const [cut, setCut] = useState(0);
  useEffect(() => {
    const e = b?.phase === "question" ? b?.phase_ends_at ?? null : null;
    if (e && cutSeen.current !== e && b?.style === "pressure") { setCut((n) => n + 1); sfx("cut"); }
    cutSeen.current = e;
  }, [b?.phase_ends_at, b?.phase, b?.style]);

  // my result each reveal: green flash or red shake
  const revealKey = b && b.status === "live" && b.phase === "reveal" ? `${b.current_round}` : "";
  const myRound = answers.find((a) => b && a.round_no === b.current_round && a.user_id === meId);
  const shownReveal = useRef("");
  useEffect(() => {
    if (!revealKey || !amPlayer || shownReveal.current === revealKey) return;
    shownReveal.current = revealKey;
    if (myRound?.correct) { setFlash("good"); sfx("correct"); } else { setFlash("bad"); shaker.start({ x: [0, -10, 9, -6, 4, 0], transition: { duration: 0.4 } }); sfx("wrong"); }
    setTimeout(() => setFlash(null), 500);
  }, [revealKey, myRound?.correct, amPlayer, shaker]);

  useEffect(() => {
    if (!b || b.status !== "finished" || endSeen.current) return;
    endSeen.current = true;
    if (b.winner_team === 0) sfx("draw"); else if (myTeam && b.winner_team === myTeam) sfx("victory"); else if (myTeam) sfx("defeat");
  }, [b, myTeam]);

  async function rpc(fn: string, args: Record<string, unknown>) {
    setErr(null);
    const { error } = await sb.rpc(fn, args);
    if (error) setErr(error.message);
    refresh();
  }
  async function rematch() {
    // same settings as this battle
    const { data: cur } = await sb.from("battles").select("course_id, chapter_id, tier, subject, both_levels, round_count, style").eq("id", battleId).single();
    const { data, error } = await sb.rpc("create_battle", {
      p_mode: mode, p_course: cur?.course_id ?? null, p_rounds: cur?.round_count || b?.round_count || 5,
      p_tier: cur?.course_id ? null : cur?.tier ?? null, p_subject: cur?.subject ?? null, p_both: !!cur?.both_levels,
      ...(cur?.chapter_id ? { p_chapter: cur.chapter_id } : {}),
      ...(cur?.style && cur.style !== "classic" ? { p_style: cur.style } : {}),
    });
    if (error) return setErr(error.message);
    router.push(`/battles/${data}`);
  }

  if (!b) return <div className="card py-16 text-center text-muted">Loading arena…</div>;

  const team = (t: number) => players.filter((p) => p.team === t);
  const teamScore = (t: number) => team(t).reduce((s, p) => s + p.score, 0);
  const curAnswers = answers.filter((a) => a.round_no === b.current_round);
  const mine = curAnswers.find((a) => a.user_id === meId);
  const reveal = b.phase === "reveal";
  // pressure mode shortens the round: use the server's deadline relative to the round start (no clock-skew issues)
  const duration = b.phase === "question" && b.phase_ends_at && b.phase_started_at
    ? Math.max(0, (+new Date(b.phase_ends_at) - +new Date(b.phase_started_at)) / 1000) : b.round_seconds;
  const left = Math.max(0, duration - (now - phaseSeen.current.at) / 1000);
  const style = b.style || "classic";
  const myDelta = players.find((p) => p.user_id === meId)?.rating_delta;
  const name = (id: string) => cards[id]?.display_name || "Player";
  const secs = Math.ceil(left);
  if (b.status === "live" && !reveal && amPlayer && !mine && secs <= 5 && secs > 0 && tickSeen.current !== secs) { tickSeen.current = secs; sfx("tick"); }
  // correct answers in a row (counting back from the last revealed round)
  const streak = (uid: string) => {
    let n = 0;
    const last = reveal || b.status === "finished" ? b.current_round : b.current_round - 1;
    for (let r = last; r >= 1; r--) { const a = answers.find((x) => x.round_no === r && x.user_id === uid); if (a?.correct) n++; else break; }
    return n;
  };
  const mvp = b.status === "finished" && players.length > 2 ? [...players].sort((x, y) => y.score - x.score)[0]?.user_id : null;

  const PlayerTile = ({ p, side }: { p: Player; side: 1 | 2 }) => {
    const c = cards[p.user_id];
    const a = curAnswers.find((x) => x.user_id === p.user_id);
    const won = b.status === "finished" && b.winner_team === p.team;
    const hot = streak(p.user_id) >= 3;
    const status = b.status === "live" && !reveal && a ? { text: "locked in", cls: "bg-surface2 text-ink" }
      : b.status === "live" && reveal ? { text: a?.correct ? `+${a.points}` : a ? (b.style === "race" && q ? `${a.choice ?? 0}/${q.options.length} in place` : "wrong") : "no answer", cls: a?.correct ? "bg-good text-white" : "bg-bad text-white" }
      : null;
    const floats = floaters.filter((f) => f.uid === p.user_id);
    return (
      // the outer box is not clipped (some themes cut card corners), so badges and emotes can sit outside the card
      <div className="relative">
        {won && <Crown className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-xp" size={22} fill="currentColor" />}
        <div className={cn("card p-2 sm:p-3", p.user_id === meId && "ring-2 ring-accent", won && "ring-2 ring-xp", mvp === p.user_id && "shadow-[0_0_24px_rgb(var(--xp)/0.6)]")}>
          {/* phones: avatar + score on top, name underneath; wider screens: one row */}
          <div className={cn("flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3", side === 2 && "sm:flex-row-reverse sm:text-right")}>
            <div className={cn("flex items-center justify-between gap-2 sm:contents", side === 2 && "flex-row-reverse")}>
              <div className="relative shrink-0">
                <Avatar name={c?.display_name || "?"} mode={(c?.avatar_mode as PCard["avatar_mode"]) || "discord"} discordUrl={c?.discord_avatar_url} robloxUrl={c?.roblox_headshot_url} blocky={c?.blocky} size={44} frame={c?.frame} />
                {hot && <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-warn text-white" title="3+ correct in a row"><Flame size={12} /></span>}
              </div>
              <motion.div key={p.score} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="shrink-0 font-display text-2xl tabular-nums sm:order-last">{p.score}</motion.div>
            </div>
            <div className={cn("min-w-0 sm:flex-1", side === 2 && "text-right")}>
              <div className="truncate text-sm font-bold sm:text-base"><NameTag name={c?.display_name || "…"} style={c?.name_style} /></div>
              <div className="truncate text-[11px] text-muted sm:text-xs">
                {style === "ranked" && c?.rating !== undefined ? <span className="font-bold" style={{ color: rankOf(c.rating).color }}>{rankOf(c.rating).emoji} {c.rating}</span> : <><PrestigeBadge n={c?.prestige} /> Lv {c?.level ?? "?"}</>}
                {p.user_id === b.host_id && " · host"}{mvp === p.user_id && " · ⭐ MVP"}
              </div>
              {(streaks[p.user_id] ?? 0) >= WANTED_AT && b.status !== "finished" && (
                <span className="mt-0.5 inline-block rounded bg-warn px-1.5 py-0.5 text-[10px] font-bold leading-none text-white" title={`Beat them for +${bountyOf(streaks[p.user_id]).pct}% XP${bountyOf(streaks[p.user_id]).coins ? ` and ${bountyOf(streaks[p.user_id]).coins} coins` : ""}`}>
                  🎯 WANTED · {streaks[p.user_id]}🔥
                </span>
              )}
                            {b.status === "finished" && typeof p.rating_delta === "number" && (
                <span className={cn("text-xs font-bold", p.rating_delta > 0 ? "text-good" : p.rating_delta < 0 ? "text-bad" : "text-muted")}>{p.rating_delta > 0 ? "+" : ""}{p.rating_delta} RR</span>
              )}
              <AnimatePresence mode="wait">
                {status && (
                  <motion.span key={status.text} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                    className={cn("mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-bold leading-none", status.cls)}>{status.text}</motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {floats.map((f) => (
            // pop in, jitter while it rises, then fade at the top: one full cycle, no restarts
            <motion.div key={f.key} initial={{ y: 0, opacity: 0, scale: 0.4 }}
              animate={{ y: [0, -18, -40, -62, -80], x: [0, -4, 4, -3, 0], rotate: [0, -8, 7, -5, 0], opacity: [0, 1, 1, 1, 0], scale: [0.4, 1.25, 1, 1, 0.9] }}
              transition={{ duration: 2.4, times: [0, 0.15, 0.45, 0.8, 1], ease: "easeOut" }}
              className={cn("pointer-events-none absolute top-0 z-20 whitespace-nowrap rounded-full border-2 border-line bg-surface px-2 py-0.5 font-bold shadow-chunky",
                side === 1 ? "left-3" : "right-3", EMOTES[f.idx].length <= 2 ? "text-2xl" : "text-sm")}>
              {EMOTES[f.idx]}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  const TeamCol = ({ t }: { t: 1 | 2 }) => (
    <div className="min-w-0 space-y-2 sm:space-y-3">
      <div className={cn("flex items-baseline justify-between gap-2", t === 2 && "flex-row-reverse")}>
        <span className={cn("font-display text-base sm:text-lg", t === 1 ? "text-accent" : "text-bad")}>{t === 1 ? "Blue" : "Red"}<span className="hidden sm:inline"> team</span></span>
        <motion.span key={teamScore(t)} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-2xl tabular-nums sm:text-3xl">{teamScore(t)}</motion.span>
      </div>
      {team(t).map((p) => <div key={p.user_id}>{PlayerTile({ p, side: t })}</div>)}
      {b.status === "lobby" && Array.from({ length: cap - team(t).length }).map((_, i) => (
        <div key={i} className="card grid h-[68px] place-items-center border-dashed text-muted">
          {amPlayer && myTeam !== t ? <button className="btn btn-ghost btn-sm" onClick={() => { unlock(); rpc("join_battle", { p_code: code, p_team: t }); }}>Switch</button>
            : !amPlayer ? <button className="btn btn-primary btn-sm" onClick={() => { unlock(); sfx("join"); rpc("join_battle", { p_code: code, p_team: t }); }}>Join</button> : "waiting…"}
        </div>
      ))}
    </div>
  );

  return (
    <motion.div className="mx-auto max-w-5xl" onPointerDown={unlock} animate={shaker}>
      {b.status === "finished" && myTeam && b.winner_team === myTeam && <><Confetti count={90} /><Confetti count={60} /></>}
      <AnimatePresence>
        {flash && <motion.div key={flash} initial={{ opacity: 0.45 }} animate={{ opacity: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          className={cn("pointer-events-none fixed inset-0 z-40", flash === "good" ? "bg-good" : "bg-bad")} />}
        {banner && (
          <motion.div key={banner.key} className="pointer-events-none fixed inset-0 z-40 grid place-items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div initial={{ scale: 3, rotate: -6 }} animate={{ scale: 1, rotate: -3 }} transition={{ type: "spring", stiffness: 260, damping: 14 }}
              className={cn("rounded px-6 py-3 font-display text-4xl tracking-wider text-white shadow-chunky sm:text-6xl", banner.final ? "bg-bad" : "bg-primary")}>
              {banner.text}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <Link href="/battles" className="text-sm text-muted hover:underline">← Battles</Link>
          <h1 className="flex items-center gap-2 font-display text-xl leading-tight sm:text-3xl"><Swords className="shrink-0" size={22} /> <span className="min-w-0">{mode} · {courseTitle}</span></h1>
          {style !== "classic" && <span className={cn("chip mt-1 text-xs font-bold", style === "ranked" ? "text-xp" : style === "duel" || style === "race" ? "text-accent" : "text-warn")}>{STYLES[style].emoji} {STYLES[style].label}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button className="chip" aria-label={sound ? "Mute music and sounds" : "Turn on music and sounds"} onClick={() => { unlock(); setSoundOn(!sound); setSound(!sound); }}>
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button className="chip font-display text-lg tracking-[0.25em]" onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {code} {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* split arena: side by side even on phones */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-4">
        {TeamCol({ t: 1 })}
        <div className="grid place-items-center self-center pt-6">
          <motion.div animate={b.status === "live" ? { scale: [1, 1.12, 1] } : {}} transition={{ repeat: Infinity, duration: b.current_round >= b.round_count ? 0.8 : 1.6 }}
            className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-base text-primary-ink shadow-chunky sm:h-16 sm:w-16 sm:text-2xl">VS</motion.div>
        </div>
        {TeamCol({ t: 2 })}
      </div>

      {/* emotes: both teams */}
      {amPlayer && b.status !== "cancelled" && (
        <div className="mt-3 flex justify-center">
          <div className="relative">
            <button className="btn btn-ghost btn-sm" onClick={() => { unlock(); setEmoteOpen((o) => !o); }} aria-expanded={emoteOpen}><Smile size={16} /> Emotes</button>
            <AnimatePresence>
              {emoteOpen && (
                // plain wrapper does the centring; framer-motion's transform would otherwise override translate-x
                <div className="absolute bottom-full left-1/2 z-30 mb-2 w-[min(92vw,340px)] -translate-x-1/2">
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="card grid grid-cols-4 gap-1.5 p-2">
                    {EMOTES.map((e, i) => (
                      <button key={e} onClick={() => sendEmote(i)} className={cn("rounded bg-surface2 py-1.5 font-bold hover:bg-primary/20", e.length <= 2 ? "text-2xl" : "col-span-2 text-sm")}>{e}</button>
                    ))}
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* round strip */}
      {b.status !== "lobby" && amPlayer && (
        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex gap-1.5">
            {Array.from({ length: b.round_count }, (_, i) => i + 1).map((r) => {
              const done = r < b.current_round || (r === b.current_round && reveal) || b.status === "finished";
              const ra = answers.filter((a) => a.round_no === r);
              const tw = (t: number) => ra.filter((a) => team(t).some((p) => p.user_id === a.user_id)).reduce((s, a) => s + a.points, 0);
              const w = !done ? 0 : tw(1) > tw(2) ? 1 : tw(2) > tw(1) ? 2 : 0;
              return (
                <div key={r} className={cn("card min-w-[54px] flex-1 p-1.5 text-center text-xs", r === b.current_round && b.status === "live" && "ring-2 ring-xp")}>
                  <div className="text-muted">R{r}</div>
                  {done ? <div className={cn("font-bold", w === 1 ? "text-accent" : w === 2 ? "text-bad" : "text-muted")}>{tw(1)} : {tw(2)}</div> : <div className="font-display">?</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* centre stage */}
      <div className="mt-4">
        {b.status === "lobby" && (
          <div className="card text-center">
            {players.filter((p) => (streaks[p.user_id] ?? 0) >= WANTED_AT).map((p) => {
              const bo = bountyOf(streaks[p.user_id]);
              return (
                <motion.div key={p.user_id} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-3 rounded border-2 border-dashed border-warn bg-warn/10 p-2 text-sm">
                  🎯 <b>{name(p.user_id)}</b> is on a <b>{streaks[p.user_id]}-win streak</b>. {p.user_id === meId ? "Everyone wants your bounty. Defend it!" : <>Beat them for <b className="text-xp">+{bo.pct}% XP</b>{bo.coins > 0 && <> and <b className="text-warn">{bo.coins} coins</b></>}!</>}
                </motion.div>
              );
            })}
            <p className="text-muted">Share the code <b className="text-ink">{code}</b> in Discord. {mode === "2v2" ? "Up to 2 per team." : "One each."} The host starts when both sides have someone.</p>
            <div className="mt-4 flex justify-center gap-3">
              {b.host_id === meId && <button className="btn btn-primary" disabled={team(1).length === 0 || team(2).length === 0} onClick={() => rpc("start_battle", { p_battle: battleId })}>Start battle</button>}
              {amPlayer && <button className="btn btn-accent" disabled={shared} onClick={async () => {
                const { error } = await sb.rpc("post_chat", { p_body: "", p_battle_code: code });
                if (error) setErr(error.message); else setShared(true);
              }}>{shared ? "Shared in chat ✔" : "Share in chat"}</button>}
              {amPlayer && <button className="btn btn-ghost" onClick={async () => { await rpc("leave_battle", { p_battle: battleId }); router.push("/battles"); }}>{b.host_id === meId ? "Cancel lobby" : "Leave"}</button>}
            </div>
          </div>
        )}

        {b.status === "live" && amPlayer && q && (
          <div className="card">
            <div className="mb-2 flex items-center justify-between text-sm text-muted">
              <span>Round {q.round} / {b.round_count}</span>
              <span className="flex items-center gap-2">
                <AnimatePresence>{style === "pressure" && cut > 0 && !reveal && (
                  <motion.span key={cut} initial={{ scale: 2, opacity: 1 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 1.2 }} className="font-display text-sm text-warn">⚡ TIME CUT!</motion.span>
                )}</AnimatePresence>
                <span className={cn("font-display text-lg tabular-nums", !reveal && left < 6 && "text-bad")}>{reveal ? "Reveal" : `${Math.ceil(left)}s`}</span>
              </span>
            </div>
            <div className="bar mb-4"><i style={{ width: `${reveal ? 100 : (left / b.round_seconds) * 100}%`, background: reveal ? "rgb(var(--muted))" : style === "pressure" && duration < b.round_seconds ? "rgb(var(--warn))" : "rgb(var(--xp))", transition: "width 0.4s linear" }} /></div>
            <AnimatePresence mode="wait">
              <motion.div key={q.round} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                {style === "duel" && q.ref && <div className="mb-1 text-xs font-bold uppercase tracking-wide text-accent">📜 Past-paper style · {q.ref}</div>}
                <h2 className="mb-4 text-xl">{q.prompt}</h2>
                {style === "race" ? (() => {
                  const n = q.options.length;
                  const myOrder = mine?.order_given || picked;
                  if (reveal && q.order) {
                    return (
                      <ol className="space-y-1.5">
                        {q.order.map((oi, pos) => {
                          const ok = myOrder[pos] === oi;
                          return (
                            <motion.li key={pos} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pos * 0.12 }}
                              className={cn("flex items-center gap-3 rounded border-2 p-2.5 font-bold", ok ? "border-good bg-good/15" : "border-bad bg-bad/10")}>
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-surface2">{pos + 1}</span>
                              <span className="flex-1">{q.options[oi]}</span>
                              {ok ? <Check size={18} className="text-good" /> : <span className="text-xs font-normal text-muted">{myOrder[pos] !== undefined ? `you: ${q.options[myOrder[pos]]}` : "—"}</span>}
                            </motion.li>
                          );
                        })}
                      </ol>
                    );
                  }
                  const locked = !!mine;
                  return (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-muted">Your order</div>
                      <ol className="mt-1 min-h-[3rem] space-y-1.5">
                        {myOrder.map((oi, pos) => (
                          <li key={oi}>
                            <button disabled={locked} onClick={() => setPicked((p) => p.filter((x) => x !== oi))}
                              className={cn("flex w-full items-center gap-3 rounded border-2 border-accent bg-accent/10 p-2.5 text-left font-bold", !locked && "hover:bg-accent/20")}>
                              <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-accent font-display text-white">{pos + 1}</span>
                              <span className="flex-1">{q.options[oi]}</span>
                              {!locked && <X size={14} className="text-muted" aria-label="Remove" />}
                            </button>
                          </li>
                        ))}
                        {!locked && myOrder.length < n && <li className="rounded border-2 border-dashed border-surface2 p-2.5 text-center text-sm text-muted">Tap a step below to put it {myOrder.length === 0 ? "first" : `at #${myOrder.length + 1}`}</li>}
                      </ol>
                      {!locked && (
                        <>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {q.options.map((o, i) => picked.includes(i) ? null : (
                              <motion.button layout key={i} onClick={() => { unlock(); sfx("lock"); setPicked((p) => [...p, i]); }}
                                className="btn btn-ghost h-auto py-2 normal-case">{o}</motion.button>
                            ))}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button className="btn btn-ghost" disabled={!picked.length} onClick={() => setPicked([])}>Reset</button>
                            <button className="btn btn-primary flex-1" disabled={picked.length !== n} onClick={() => rpc("answer_race", { p_battle: battleId, p_order: picked })}>
                              {picked.length === n ? "Lock in order" : `${n - picked.length} left to place`}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })() : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, i) => {
                    const picked = mine?.choice === i;
                    const isRight = reveal && q.correct === i;
                    const isWrong = reveal && picked && q.correct !== i;
                    const who = reveal ? curAnswers.filter((a) => a.choice === i) : [];
                    return (
                      <button key={i} disabled={!!mine || reveal} onClick={() => { unlock(); sfx("lock"); rpc("answer_battle", { p_battle: battleId, p_choice: i }); }}
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
                )}
                {!reveal && mine && <p className="mt-3 text-center text-sm text-muted">Locked in. Waiting for the others…</p>}
                {reveal && (style === "duel" || style === "race") && (q.guide || q.explanation) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-4 rounded border-2 border-accent/40 bg-accent/10 p-3 text-left text-sm">
                    {q.explanation && <p><b>Why:</b> {q.explanation}</p>}
                    {q.guide && <p className="mt-2"><b>📝 How to score it in the exam:</b> {q.guide}</p>}
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
        {b.status === "live" && !amPlayer && <div className="card text-center text-muted">Battle in progress. Spectators see the scores only.</div>}

        {b.status === "finished" && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card text-center">
            <motion.div initial={{ scale: 2.5, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
              className={cn("font-display text-5xl", myTeam && b.winner_team === myTeam ? "text-xp" : myTeam && b.winner_team && b.winner_team !== myTeam ? "text-bad" : "")}>
              {b.winner_team === 0 ? "🤝 Draw!" : myTeam ? (b.winner_team === myTeam ? "🏆 Victory!" : "💀 Defeat") : `Team ${b.winner_team === 1 ? "Blue" : "Red"} wins!`}
            </motion.div>
            {mvp && <p className="mt-2 font-bold">⭐ MVP: {name(mvp)}</p>}
            {style === "ranked" && typeof myDelta === "number" && (() => {
              const r = cards[meId]?.rating;
              const after = r !== undefined ? r + myDelta : undefined;
              return (
                <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="mt-3">
                  <div className={cn("font-display text-3xl", myDelta > 0 ? "text-good" : myDelta < 0 ? "text-bad" : "text-muted")}>{myDelta > 0 ? "+" : ""}{myDelta} RR</div>
                  {after !== undefined && <div className="text-sm font-bold" style={{ color: rankOf(after).color }}>{rankOf(after).emoji} {rankOf(after).name} · {after}</div>}
                  {myDelta === 0 && <div className="text-xs text-muted">No rating change: you&apos;ve played this opponent 3 times in ranked today.</div>}
                </motion.div>
              );
            })()}
            {bounty.filter((e) => e.user_id === meId && e.kind !== "streak").map((e) => (
              <motion.div key={e.kind} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
                className={cn("mx-auto mt-2 max-w-md rounded border-2 p-2 text-sm font-bold", e.kind === "claim" ? "border-warn bg-warn/15" : e.kind === "hot" ? "border-xp bg-xp/10" : "border-bad bg-bad/10")}>
                {e.kind === "claim" && <>🎯 BOUNTY CLAIMED! You ended {name(e.other_id || "")}&apos;s {e.streak}-win streak: +{e.xp} XP{e.coins > 0 && ` and +${e.coins} coins`}</>}
                {e.kind === "hot" && <>🔥 {e.streak}-win streak! +{e.xp} bonus XP. There&apos;s a bounty on you now.</>}
                {e.kind === "ended" && <>💔 Your {e.streak}-win streak is over. {name(e.other_id || "")} took the bounty.</>}
              </motion.div>
            ))}
            {(() => { const rx = players.find((p) => p.user_id === meId)?.reward_xp; return typeof rx === "number" && rx > 0
              ? <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mt-3 font-display text-3xl text-xp">+{rx} XP</motion.div> : null; })()}
            <p className="mt-1 text-muted">{teamScore(1)} – {teamScore(2)} · {style === "race" ? "Race XP: win 60, draw 35, lose 20 (5 rewarded races a day)" : style === "duel"
              ? "Duel XP: 15 per correct answer, winner doubled + 50 bonus (5 rewarded duels a day, 3 per opponent)"
              : "XP added to your profile (5 rewarded battles a day)"}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button className="btn btn-primary" onClick={rematch}>New lobby</button>
              <Link className="btn btn-ghost" href="/battles">Back</Link>
            </div>
          </motion.div>
        )}
        {b.status === "cancelled" && <div className="card text-center text-muted">This lobby was closed. <Link className="underline" href="/battles">Find another</Link></div>}
        {err && <p className="mt-3 text-center text-sm text-bad" role="alert">{err}</p>}
      </div>
    </motion.div>
  );
}
