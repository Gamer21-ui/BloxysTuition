"use server";
import { requireApproved } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { postToDiscord, siteUrl } from "@/lib/discord";

/** Posts a finished battle to Discord exactly once (guarded by the `announced` flag in the database). */
export async function announceBattle(battleId: string) {
  await requireApproved();
  const admin = createAdminClient();
  const { data: claimed } = await admin.from("battles").update({ announced: true })
    .eq("id", battleId).eq("status", "finished").eq("announced", false)
    .select("code, mode, winner_team, course:courses(title)").maybeSingle();
  if (!claimed) return;
  const { data: players } = await admin.from("battle_players").select("team, score, profile:profiles(display_name)").eq("battle_id", battleId);
  const team = (t: number) => (players || []).filter((p) => p.team === t);
  const names = (t: number) => team(t).map((p) => (p.profile as unknown as { display_name: string })?.display_name).join(" & ");
  const score = (t: number) => team(t).reduce((s, p) => s + p.score, 0);
  const w = claimed.winner_team;
  await postToDiscord("", [{
    title: w === 0 ? `🤝 Draw! ${names(1)} vs ${names(2)}` : `⚔️ ${names(w!)} won a ${claimed.mode} battle!`,
    description: `**${names(1)}** ${score(1)} — ${score(2)} **${names(2)}**\n${(claimed.course as unknown as { title?: string } | null)?.title || "All subjects"}`,
    color: 0xff4b4b,
    url: siteUrl() + "/battles",
  }]);
}
