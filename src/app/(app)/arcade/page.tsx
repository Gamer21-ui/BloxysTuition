import type { Metadata } from "next";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Arcade" };
export const dynamic = "force-dynamic";

const GAMES = [
  { slug: "ip-blaster", ids: ["ip-blaster-v4", "ip-blaster-v6"], emoji: "🎯", name: "IP Blaster", genre: "Shooter", topic: "IP addresses · IPv4 vs IPv6", blurb: "Shoot the valid IP addresses, dodge the fakes. Rookie (IPv4) or Elite (IPv6) mode." },
  { slug: "cpu-commander", ids: ["cpu-commander"], emoji: "🤖", name: "CPU Commander", genre: "Puzzle", topic: "Instruction sets · fetch–decode–execute", blurb: "Program a tiny CPU using only its instruction set. Watch every fetch, decode and execute." },
  { slug: "embedded-sorter", ids: ["embedded-sorter"], emoji: "🏭", name: "Embedded Sorter", genre: "Arcade", topic: "Embedded systems", blurb: "Sort devices on a speeding factory belt: embedded or general-purpose?" },
];

export default async function Arcade() {
  const me = await requireApproved();
  const sb = await createClient();
  const today = new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);
  const { data: plays } = await sb.from("arcade_plays").select("game, success, xp, created_at").eq("user_id", me.id).order("created_at", { ascending: false }).limit(200);
  const paidToday = (ids: string[]) => (plays || []).some((p) => ids.includes(p.game) && p.xp > 0 && new Date(+new Date(p.created_at) + 4 * 3600_000).toISOString().slice(0, 10) === today);
  const wins = (ids: string[]) => (plays || []).filter((p) => ids.includes(p.game) && p.success).length;
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">🕹️ Arcade</h1>
      <p className="text-muted">Learn by playing. Win a game for <b className="text-ink">+40 XP and +10 coins</b> (once a day per game). Lose and you lose nothing, so just try again.</p>
      <div className="mt-2 text-xs font-bold uppercase tracking-wider text-muted">O Level Computer Science · Chapter 3: Hardware</div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GAMES.map((g) => (
          <Link key={g.slug} href={`/arcade/${g.slug}`} className="card group block transition hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div className="text-5xl transition group-hover:scale-110">{g.emoji}</div>
              <span className="chip text-xs">{g.genre}</span>
            </div>
            <h2 className="mt-2 font-display text-2xl">{g.name}</h2>
            <div className="text-xs font-bold text-accent">{g.topic}</div>
            <p className="mt-2 text-sm text-muted">{g.blurb}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-muted">🏆 {wins(g.ids)} win{wins(g.ids) === 1 ? "" : "s"}</span>
              {paidToday(g.ids) ? <span className="font-bold text-good">✅ Today&apos;s reward claimed</span> : <span className="font-bold text-xp">🎁 Reward available</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
