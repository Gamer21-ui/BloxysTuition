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

// Emotes are sent as an index into this list, so nobody can broadcast their own text.
const EMOTES = ["👍", "😂", "😭", "🔥", "💀", "😎", "🤯", "👑", "GG", "Nice one!", "So close!", "Let's go!", "Good luck!", "Wow!"];
type Floater = { key: number; uid: string; idx: number };

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
      : b.status === "live" && reveal ? { text: a?.correct ? `+${a.points}` : a ? "wrong" : "no answer", cls: a?.correct ? "bg-good text-white" : "bg-bad text-white" }
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
              <div className="truncate text-[11px] text-muted sm:text-xs">Lv {c?.level ?? "?"}{p.user_id === b.host_id && " · host"}{mvp === p.user_id && " · ⭐ MVP"}</div>
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
            <motion.div key={f.key} initial={{ y: 0, opacity: 0, scale: 0.5 }} animate={{ y: -70, opacity: [0, 1, 1, 0], scale: 1 }} transition={{ duration: 2.4, ease: "easeOut" }}
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
      {team(t).map((p) => <PlayerTile key={p.user_id} p={p} side={t} />)}
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
        <TeamCol t={1} />
        <div className="grid place-items-center self-center pt-6">
          <motion.div animate={b.status === "live" ? { scale: [1, 1.12, 1] } : {}} transition={{ repeat: Infinity, duration: b.current_round >= b.round_count ? 0.8 : 1.6 }}
            className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-base text-primary-ink shadow-chunky sm:h-16 sm:w-16 sm:text-2xl">VS</motion.div>
        </div>
        <TeamCol t={2} />
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
                {!reveal && mine && <p className="mt-3 text-center text-sm text-muted">Locked in. Waiting for the others…</p>}
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
    </motion.div>
  );
}
