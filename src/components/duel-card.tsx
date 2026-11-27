"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScrollText, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { cn } from "@/lib/utils";

export type DuelRow = {
  id: string; display_name: string; avatar_mode: string; discord_avatar_url: string | null; roblox_headshot_url: string | null;
  blocky: unknown; name_style: string | null; frame: string | null; wins: number; played: number; accuracy: number;
};

/** Past-paper Duel entry on a chapter page: start a 1v1, see the chapter ranking; tutors open or close it. */
export function DuelCard({ chapterId, open, isTutor, ranking, meId }: { chapterId: string; open: boolean; isTutor: boolean; ranking: DuelRow[]; meId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rounds, setRounds] = useState(5);
  const sb = createClient();

  async function start() {
    setBusy(true); setErr(null);
    const { data, error } = await sb.rpc("create_battle", { p_mode: "1v1", p_chapter: chapterId, p_rounds: rounds, p_style: "duel" });
    setBusy(false);
    if (error) return setErr(error.message);
    router.push(`/battles/${data}`);
  }
  async function toggle() {
    setBusy(true); setErr(null);
    const { error } = await sb.rpc("set_duel_open", { p_chapter: chapterId, p_open: !open });
    setBusy(false);
    if (error) return setErr(error.message);
    router.refresh();
  }

  if (!open && !isTutor) return null;
  const myPos = ranking.findIndex((r) => r.id === meId);

  return (
    <div className="card mb-4 border-2 border-accent/40">
      <div className="flex items-center gap-2">
        <ScrollText className="text-accent" size={22} aria-hidden="true" />
        <div className="font-display text-xl">Past-paper Duel</div>
        {isTutor && <span className={cn("chip ml-auto text-xs font-bold", open ? "text-good" : "text-muted")}>{open ? "Open" : "Closed"}</span>}
      </div>
      <p className="mt-1 text-sm text-muted">1v1 with exam-style questions from this chapter. After each one you see how to score it in the real paper.</p>
      <ul className="mt-2 space-y-0.5 text-sm">
        <li>🏆 Winner: <b>double XP</b> + <b>50 bonus</b> + 20 coins</li>
        <li>📘 Loser: <b>15 XP</b> for every correct answer</li>
      </ul>

      {open && (
        <div className="mt-3 flex gap-2">
          <select className="input w-auto" value={rounds} onChange={(e) => setRounds(+e.target.value)} aria-label="Rounds">
            <option value={5}>5 questions</option>
            <option value={7}>7 questions</option>
          </select>
          <button className="btn btn-accent flex-1" disabled={busy} onClick={start}>Start a duel</button>
        </div>
      )}
      {open && <p className="mt-1 text-xs text-muted">You get a code to share in chat. Your opponent joins with it.</p>}
      {isTutor && (
        <button className="btn btn-ghost btn-sm mt-3 w-full" disabled={busy} onClick={toggle}>
          {open ? "Close duels for this chapter" : "Open duels (chapter has been taught)"}
        </button>
      )}
      {err && <p className="mt-2 text-sm text-bad" role="alert">{err}</p>}

      <div className="mt-4">
        <div className="mb-1 flex items-center gap-1.5 text-sm font-bold"><Trophy size={15} className="text-xp" aria-hidden="true" /> Chapter ranking</div>
        {ranking.length === 0 ? (
          <p className="text-sm text-muted">No duels yet. Be the first champion of this chapter!</p>
        ) : (
          <ol className="space-y-1">
            {ranking.map((r, i) => (
              <li key={r.id} className={cn("flex items-center gap-2 rounded px-2 py-1 text-sm", r.id === meId ? "bg-accent/15 ring-1 ring-accent" : "bg-surface2")}>
                <span className={cn("w-5 text-center font-display", i === 0 && "text-xp")}>{i === 0 ? "👑" : i + 1}</span>
                <Avatar name={r.display_name} mode={(r.avatar_mode as "discord") || "discord"} discordUrl={r.discord_avatar_url} robloxUrl={r.roblox_headshot_url} blocky={r.blocky as never} size={24} frame={r.frame} />
                <span className="min-w-0 flex-1 truncate"><NameTag name={r.display_name} style={r.name_style} /></span>
                <span className="tabular-nums font-bold">{r.wins}W</span>
                <span className="w-16 text-right text-xs tabular-nums text-muted">{r.played} · {r.accuracy}%</span>
              </li>
            ))}
          </ol>
        )}
        {ranking.length > 0 && <p className="mt-1 text-xs text-muted">Wins, then accuracy. {myPos === -1 ? "Win a duel to get on the board." : `You're #${myPos + 1}.`}</p>}
      </div>
    </div>
  );
}
