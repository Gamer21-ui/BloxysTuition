import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ARCADE } from "@/lib/arcade";
import { takes } from "@/lib/subjects";
import { GameCard } from "@/components/game-card";

export const metadata: Metadata = { title: "Arcade" };
export const dynamic = "force-dynamic";

const COURSE_NAME: Record<string, string> = { "o-computer-science": "O Level Computer Science", "as-computer-science": "AS Level Computer Science", "a-computer-science": "A Level Computer Science" };

export default async function Arcade() {
  const me = await requireApproved();
  const special = me.role === "tutor" || !!me.special;
  const sb = await createClient();
  const today = new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);
  const { data: plays } = await sb.from("arcade_plays").select("game, success, xp, created_at").eq("user_id", me.id).order("created_at", { ascending: false }).limit(200);
  const paidToday = (ids: string[]) => (plays || []).some((p) => ids.includes(p.game) && p.xp > 0 && new Date(+new Date(p.created_at) + 4 * 3600_000).toISOString().slice(0, 10) === today);
  const wins = (ids: string[]) => (plays || []).filter((p) => ids.includes(p.game) && p.success).length;
  // group by course; students only see courses they take, at their level
  const tutor = me.role === "tutor";
  const courses = Object.keys(COURSE_NAME).filter((c) => tutor || (takes(me, c) && (c.startsWith("o-") ? me.tier === "O" : me.tier !== "O")));
  const sections = courses.map((c) => ({ c, games: ARCADE.filter((g) => g.where.some((w) => w.course === c)) })).filter((s) => s.games.length);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">🕹️ Arcade</h1>
      <p className="text-muted">Learn by playing. Win a game for <b className="text-ink">+40 XP and +10 coins</b> (once a day per game). Lose and you lose nothing, so just try again.</p>
      {sections.map(({ c, games }) => (
        <section key={c}>
          <div className="mt-5 text-xs font-bold uppercase tracking-wider text-muted">{COURSE_NAME[c]}</div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((g) => (
              <GameCard key={g.slug} g={g} wins={wins(g.ids)} paidToday={paidToday(g.ids)} note={g.slug === "trace-master" && special ? "🌟 Pro mode unlocked for you." : undefined} />
            ))}
          </div>
        </section>
      ))}
      {!sections.length && <p className="card mt-5 text-center text-muted">No games for your subjects yet. More are on the way! 🎮</p>}
    </div>
  );
}
