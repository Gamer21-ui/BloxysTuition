import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { bountyOf, hotPct, WANTED_AT } from "@/lib/bounty";
import { cn } from "@/lib/utils";

export type WantedRow = { id: string; display_name: string; avatar_mode: string; discord_avatar_url: string | null; roblox_headshot_url: string | null;
  blocky: unknown; name_style: string | null; frame: string | null; tier: string; win_streak: number; best_win_streak: number };

/** Wanted posters for everyone on a 3+ win streak, plus your own streak. */
export function MostWanted({ rows, meId, myStreak }: { rows: WantedRow[]; meId: string; myStreak: number }) {
  return (
    <div className="card mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-2xl">🎯 Most Wanted</h2>
        <span className="text-sm text-muted">Your win streak: <b className={cn("text-ink", myStreak >= WANTED_AT && "text-warn")}>{myStreak}🔥</b>
          {myStreak >= WANTED_AT ? ` · you get +${hotPct(myStreak)}% XP per win (and you're being hunted)` : ` · ${WANTED_AT - myStreak} more to get a bounty`}</span>
      </div>
      <p className="mt-1 text-sm text-muted">Win 3 battles in a row (any style, different opponents each day) and a bounty goes on your head. End someone&apos;s streak to claim it:
        <b className="text-ink"> +2.5% XP per streak win</b> (max +50%) and <b className="text-ink">250 coins for every 5</b>.</p>
      {rows.length === 0 ? (
        <p className="mt-3 rounded bg-surface2 p-3 text-center text-sm text-muted">Nobody is wanted right now. Win 3 in a row to be the first. 🤠</p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => {
            const b = bountyOf(r.win_streak);
            return (
              <div key={r.id} className={cn("relative rounded border-2 border-dashed border-warn/60 bg-warn/10 p-3 text-center", r.id === meId && "ring-2 ring-accent")}>
                <div className="font-display text-sm tracking-[0.3em] text-warn">WANTED</div>
                <div className="mt-2 flex justify-center"><Avatar name={r.display_name} mode={(r.avatar_mode as "discord") || "discord"} discordUrl={r.discord_avatar_url} robloxUrl={r.roblox_headshot_url} blocky={r.blocky as never} size={56} frame={r.frame} /></div>
                <div className="mt-1 truncate font-bold"><NameTag name={r.display_name} style={r.name_style} /></div>
                <div className="text-xs text-muted">{r.tier} Level · {r.win_streak}-win streak 🔥</div>
                <div className="mt-2 rounded bg-surface px-2 py-1 text-sm font-bold">
                  Bounty: <span className="text-xp">+{b.pct}% XP</span>{b.coins > 0 && <> · <span className="text-warn">{b.coins} coins</span></>}
                </div>
                {b.coins === 0 && <div className="mt-1 text-[11px] text-muted">{5 - (r.win_streak % 5)} more wins until 250 coins</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
