import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AchievementBadge, rarityLabel } from "@/components/badge";
import { fmtDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Achievements" };

export default async function Achievements() {
  const me = await requireApproved();
  const sb = await createClient();
  const [{ data: all }, { data: mine }] = await Promise.all([
    sb.from("achievements").select("*").eq("active", true).order("xp_reward"),
    sb.from("user_achievements").select("achievement_id, earned_at").eq("user_id", me.id),
  ]);
  const earned = new Map((mine || []).map((m) => [m.achievement_id, m.earned_at]));
  return (
    <div>
      <h1 className="page-title">Achievements</h1>
      <p className="mt-1 text-muted">{earned.size} of {(all || []).length} unlocked</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(all || []).map((a) => {
          const at = earned.get(a.id);
          return (
            <div key={a.id} className={`card flex items-center gap-4 ${at ? "" : "opacity-80"}`}>
              <AchievementBadge icon={a.icon} rarity={a.rarity} locked={!at} title={a.title} />
              <div className="min-w-0">
                <div className="font-display text-lg leading-tight">{a.title}</div>
                <div className="text-sm text-muted">{a.description}</div>
                <div className="mt-1 text-xs font-bold">
                  <span className="text-accent">{rarityLabel(a.rarity)}</span> · +{a.xp_reward} XP{at && <span className="text-good"> · {fmtDate(at)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
