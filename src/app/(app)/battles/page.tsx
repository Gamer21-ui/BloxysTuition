import type { Metadata } from "next";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import { BattleLobbyForms } from "./lobby-forms";

export const metadata: Metadata = { title: "Battles" };
export const dynamic = "force-dynamic";

export default async function Battles() {
  const me = await requireApproved();
  const sb = await createClient();
  const since = new Date(Date.now() - 3 * 3600_000).toISOString();
  const [{ data: courses }, { data: open }, { data: mine }] = await Promise.all([
    sb.from("courses").select("id, title, code").eq("active", true).order("sort"),
    sb.from("battles").select("id, code, mode, status, created_at, round_count, course:courses(title), players:battle_players(user_id, team)")
      .in("status", ["lobby", "live"]).gte("created_at", since).order("created_at", { ascending: false }).limit(20),
    sb.from("battle_players").select("score, team, battle:battles!inner(code, mode, status, winner_team, created_at, course:courses(title))")
      .eq("user_id", me.id).eq("battle.status", "finished").order("joined_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">⚔️ Quiz Battles</h1>
      <p className="text-muted">1v1 or 2v2. Same question for everyone, 20 seconds a round. Right answers score 100, plus up to 100 more for speed. Highest team total wins.</p>
      <BattleLobbyForms courses={courses || []} />

      <SectionTitle>Open lobbies</SectionTitle>
      {!open?.length ? <Empty>No one is waiting right now. Create a battle and share the code in Discord!</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {open.map((b) => {
            const players = (b.players as { user_id: string; team: number }[]) || [];
            const cap = b.mode === "1v1" ? 2 : 4;
            const inIt = players.some((p) => p.user_id === me.id);
            return (
              <Card key={b.id} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-display text-xl tracking-wider">{b.code} <span className="chip ml-1">{b.mode}</span></div>
                  <div className="text-sm text-muted">{(b.course as { title?: string } | null)?.title || "All subjects"} · {b.round_count} rounds · {timeAgo(b.created_at)}</div>
                  <div className="text-sm">{players.length}/{cap} players {b.status === "live" && <span className="text-warn">· in progress</span>}</div>
                </div>
                <Link className={`btn btn-sm ${inIt ? "btn-accent" : "btn-primary"}`} href={`/battles/${b.code}`}>
                  {inIt ? "Rejoin" : b.status === "live" ? "Watch" : "Join"}
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <SectionTitle>Your recent battles</SectionTitle>
      {!mine?.length ? <Empty>No battles finished yet.</Empty> : (
        <Card className="divide-y divide-line p-0">
          {mine.map((m, i) => {
            const b = m.battle as unknown as { code: string; mode: string; winner_team: number; created_at: string; course: { title: string } | null };
            const res = b.winner_team === 0 ? "Draw" : b.winner_team === m.team ? "Win" : "Loss";
            return (
              <Link key={i} href={`/battles/${b.code}`} className="flex items-center justify-between px-4 py-3 hover:bg-surface2">
                <span><b className={res === "Win" ? "text-good" : res === "Loss" ? "text-bad" : "text-warn"}>{res}</b> · {b.mode} · {b.course?.title || "All subjects"}</span>
                <span className="text-sm text-muted">{m.score} pts · {timeAgo(b.created_at)}</span>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
