import type { Metadata } from "next";
import Link from "next/link";
import { Crown } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { rankName } from "@/lib/xp";
import { rankOf } from "@/lib/ranks";
import { Countdown } from "@/components/countdown";
import { PrestigeBadge } from "@/components/prestige-badge";

export const metadata: Metadata = { title: "Leaderboard" };

const KINDS = [
  { k: "season", label: "🏁 Season XP", unit: "XP" },
  { k: "ranked", label: "🏆 Ranked", unit: "RR" },
  { k: "xp", label: "All-time XP", unit: "XP" },
  { k: "monthly", label: "This month", unit: "XP" },
  { k: "speedrun", label: "Speedrun", unit: "pts" },
  { k: "battles", label: "Battle wins", unit: "wins" },
  { k: "attendance", label: "Attendance", unit: "classes" },
];

export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const me = await requireApproved();
  const sb = await createClient();
  await sb.rpc("season_tick"); // starts/ends seasons on time (also run by the daily cron)
  // seasons only exist once the seasons database update has been run; until then hide the Season tab
  const { data: seasons, error: seasonErr } = await sb.from("seasons").select("id, number, name, starts_at, ends_at, status").order("number", { ascending: false }).limit(4);
  const kinds = seasonErr ? KINDS.filter((x) => x.k !== "season") : KINDS;
  const { kind = kinds[0].k } = await searchParams;
  const k = kinds.find((x) => x.k === kind) ?? kinds[0];
  const { data } = await sb.rpc("get_leaderboard", { p_kind: k.k, p_limit: 50 });
  type S = { id: number; number: number; name: string; starts_at: string; ends_at: string; status: "upcoming" | "active" | "ended" };
  const ss = (seasons as S[]) || [];
  const active = ss.find((x) => x.status === "active");
  const upcoming = [...ss].reverse().find((x) => x.status === "upcoming");
  const lastEnded = ss.find((x) => x.status === "ended");
  const { data: hof } = lastEnded
    ? await sb.from("season_results").select("board, place, value, user_id").eq("season_id", lastEnded.id).lte("place", 3).order("place")
    : { data: null };
  const hofIds = [...new Set((hof || []).map((h) => h.user_id))];
  const { data: hofCards } = hofIds.length ? await sb.rpc("profile_cards", { p_ids: hofIds }) : { data: null };
  const hofName = (id: string) => ((hofCards as { id: string; display_name: string }[]) || []).find((c) => c.id === id)?.display_name || "Player";
  const muDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Indian/Mauritius" });
  const rows = (data || []) as { id: string; display_name: string; avatar_mode: "discord"; discord_avatar_url: string | null; roblox_headshot_url: string | null; blocky: object; title: string | null; level: number; value: number; name_style: string | null; frame: string | null; prestige?: number }[];
  const medal = ["#ffc800", "#cbd5e1", "#f59e0b"];
  return (
    <div>
      <h1 className="page-title">Leaderboard</h1>
      {(active || upcoming) && (
        <div className="card mt-4 overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-4 p-4" style={{ background: "linear-gradient(120deg, rgb(124 58 237 / .18), rgb(250 204 21 / .18))" }}>
            <div className="text-4xl">🏁</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">{active ? "Season live" : "Next season"}</div>
              <div className="font-display text-2xl">{(active || upcoming)!.name}</div>
              <div className="text-sm text-muted">{muDate((active || upcoming)!.starts_at)} – {muDate((active || upcoming)!.ends_at)} (Mauritius time)</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-muted">{active ? "Ends in" : "Starts in"}</div>
              <Countdown to={active ? active.ends_at : upcoming!.starts_at} className="font-display text-xl tabular-nums sm:text-2xl" />
            </div>
          </div>
          <details className="border-t-2 border-line px-4 py-3 text-sm">
            <summary className="cursor-pointer font-bold">🎁 Season rewards (Season XP and Ranked, top 10 each)</summary>
            <ul className="mt-2 space-y-1 text-muted">
              <li>🥇 <b className="text-ink">#1:</b> Champion title, Season Champion name style, Season frame, 1000 coins</li>
              <li>🥈 <b className="text-ink">#2–3:</b> Top 3 title, Season frame, 600 / 400 coins</li>
              <li>⭐ <b className="text-ink">#4–10:</b> Top 10 title, 150 coins</li>
              <li>Ranked ratings reset to 1000 when a season starts. {active ? "" : "Anything before the season starts is warm-up and doesn't count."}</li>
            </ul>
          </details>
        </div>
      )}
      {lastEnded && (hof || []).length > 0 && (
        <div className="card mt-3 text-sm">
          <div className="mb-1 font-bold">🏛️ Hall of fame · {lastEnded.name}</div>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {(["xp", "ranked"] as const).map((brd) => (
              <div key={brd}><span className="text-muted">{brd === "xp" ? "Season XP:" : "Ranked:"}</span>{" "}
                {(hof || []).filter((h) => h.board === brd).map((h) => <span key={h.place} className="mr-2">{["🥇", "🥈", "🥉"][h.place - 1]} {hofName(h.user_id)}</span>)}
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {kinds.map((x) => <Link key={x.k} href={`/leaderboard?kind=${x.k}`} className={`btn btn-sm ${x.k === k.k ? "btn-primary" : "btn-ghost"}`}>{x.label}</Link>)}
      </div>
      <div className="mt-6 space-y-2">
        {rows.length === 0 && <div className="card text-muted">{k.k === "season" && !active && upcoming
          ? `${upcoming.name} hasn't started yet. It begins on ${muDate(upcoming.starts_at)}: November is a warm-up, so practise now and be ready! 💪`
          : k.k === "ranked" ? "No ranked battles yet this season. Play a 🏆 Ranked battle to get on the board." : "No students on the board yet."}</div>}
        {rows.map((r, i) => (
          <div key={r.id} className={`card flex items-center gap-3 py-3 ${r.id === me.id ? "ring-4 ring-accent" : ""}`}>
            <div className="w-8 text-center font-display text-xl" style={{ color: medal[i] }}>{i < 3 ? <Crown className="mx-auto" aria-label={`Rank ${i + 1}`} /> : i + 1}</div>
            <Avatar name={r.display_name} mode={r.avatar_mode} discordUrl={r.discord_avatar_url} robloxUrl={r.roblox_headshot_url} blocky={r.blocky} size={44} frame={r.frame} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display"><NameTag name={r.display_name} style={r.name_style} /></div>
              <div className="text-xs text-muted">{k.k === "ranked" ? <span className="font-bold" style={{ color: rankOf(Number(r.value)).color }}>{rankOf(Number(r.value)).emoji} {rankOf(Number(r.value)).name}</span> : <><PrestigeBadge n={r.prestige} /> Lv {r.level} · {r.title || rankName(r.level)}</>}</div>
            </div>
            <div className="text-right font-display text-lg">{Number(r.value).toLocaleString()} <span className="text-xs text-muted">{k.unit}</span></div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Scores are calculated on the server. Suspiciously fast quiz runs are flagged and don&apos;t count.</p>
    </div>
  );
}
