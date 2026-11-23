import type { Metadata } from "next";
import Link from "next/link";
import { Crown } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { rankName } from "@/lib/xp";

export const metadata: Metadata = { title: "Leaderboard" };

const KINDS = [
  { k: "xp", label: "All-time XP", unit: "XP" },
  { k: "monthly", label: "This month", unit: "XP" },
  { k: "speedrun", label: "Speedrun", unit: "pts" },
  { k: "battles", label: "Battle wins", unit: "wins" },
  { k: "attendance", label: "Attendance", unit: "classes" },
];

export default async function Leaderboard({ searchParams }: { searchParams: Promise<{ kind?: string }> }) {
  const me = await requireApproved();
  const { kind = "xp" } = await searchParams;
  const k = KINDS.find((x) => x.k === kind) ?? KINDS[0];
  const sb = await createClient();
  const { data } = await sb.rpc("get_leaderboard", { p_kind: k.k, p_limit: 50 });
  const rows = (data || []) as { id: string; display_name: string; avatar_mode: "discord"; discord_avatar_url: string | null; roblox_headshot_url: string | null; blocky: object; title: string | null; level: number; value: number; name_style: string | null; frame: string | null }[];
  const medal = ["#ffc800", "#cbd5e1", "#f59e0b"];
  return (
    <div>
      <h1 className="page-title">Leaderboard</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {KINDS.map((x) => <Link key={x.k} href={`/leaderboard?kind=${x.k}`} className={`btn btn-sm ${x.k === k.k ? "btn-primary" : "btn-ghost"}`}>{x.label}</Link>)}
      </div>
      <div className="mt-6 space-y-2">
        {rows.length === 0 && <div className="card text-muted">No students on the board yet.</div>}
        {rows.map((r, i) => (
          <div key={r.id} className={`card flex items-center gap-3 py-3 ${r.id === me.id ? "ring-4 ring-accent" : ""}`}>
            <div className="w-8 text-center font-display text-xl" style={{ color: medal[i] }}>{i < 3 ? <Crown className="mx-auto" aria-label={`Rank ${i + 1}`} /> : i + 1}</div>
            <Avatar name={r.display_name} mode={r.avatar_mode} discordUrl={r.discord_avatar_url} robloxUrl={r.roblox_headshot_url} blocky={r.blocky} size={44} frame={r.frame} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-display"><NameTag name={r.display_name} style={r.name_style} /></div>
              <div className="text-xs text-muted">Lv {r.level} · {r.title || rankName(r.level)}</div>
            </div>
            <div className="text-right font-display text-lg">{Number(r.value).toLocaleString()} <span className="text-xs text-muted">{k.unit}</span></div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">Scores are calculated on the server. Suspiciously fast quiz runs are flagged and don&apos;t count.</p>
    </div>
  );
}
