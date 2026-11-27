import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { HubTile } from "@/components/hub-tile";

export const metadata: Metadata = { title: "Play" };

export default async function Play() {
  const me = await requireApproved();
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">🎮 Play</h1>
      <p className="text-muted">Everything fun in one place. Study hard, then come here to flex it. 🪙 {me.coins} coins to spend.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <HubTile href="/battles" emoji="⚔️" title="Battles" text="Quiz battles: 1v1, 2v2, ranked and pressure mode" accent />
        <HubTile href="/arcade" emoji="🕹️" title="Arcade" text="Mini-games for your subjects: +40 XP a day per game" accent />
        <HubTile href="/play/replays" emoji="📼" title="Lesson replays" text="Replay the interactive lessons and beat your live score" />
        <HubTile href="/challenges" emoji="🎯" title="Quests" text="Daily and weekly challenges for bonus XP" />
        <HubTile href="/leaderboard" emoji="🏆" title="Leaderboard" text="Season ranking, ranked ladder and hall of fame" />
        <HubTile href="/shop" emoji="🛍️" title="Shop" text="Frames, name styles, power-ups… and maybe more 👀" />
      </div>
    </div>
  );
}
