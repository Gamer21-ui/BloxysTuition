"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { postToDiscord, siteUrl } from "@/lib/discord";
import { levelFromXp, rankName } from "@/lib/xp";
import { HAT_UNLOCKS } from "@/components/blocky-avatar";

/** Posts a level-up to Discord once per level. The level is read from the database, never trusted from the browser. */
export async function announceLevelUp() {
  const me = await requireApproved();
  const admin = createAdminClient();
  const { data: p } = await admin.from("profiles").select("xp, announced_level, display_name").eq("id", me.id).single();
  if (!p) return;
  const level = levelFromXp(p.xp);
  if (level <= p.announced_level) return;
  await admin.from("profiles").update({ announced_level: level }).eq("id", me.id);
  await postToDiscord("", [{
    title: `⬆️ ${p.display_name} reached Level ${level}!`,
    description: `New rank: **${rankName(level)}** · ${p.xp.toLocaleString()} XP total`,
    color: 0x58cc02,
    url: siteUrl() + "/leaderboard",
  }]);
}

export async function markAllRead() {
  await requireApproved();
  const sb = await createClient();
  await sb.from("notifications").update({ read_at: new Date().toISOString() }).is("read_at", null);
  revalidatePath("/", "layout");
}

const blockySchema = z.object({
  skin: z.string().regex(/^#[0-9a-f]{6}$/i),
  shirt: z.string().regex(/^#[0-9a-f]{6}$/i),
  pants: z.string().regex(/^#[0-9a-f]{6}$/i),
  bg: z.string().regex(/^#[0-9a-f]{6}$/i),
  face: z.enum(["smile", "cool", "wink", "grin", "focused"]),
  hat: z.enum(["none", "cap", "crown", "tophat", "headphones", "halo", "viking"]),
});

export async function saveAvatar(input: { mode: string; blocky: unknown; displayName: string }) {
  const me = await requireApproved();
  const blocky = blockySchema.parse(input.blocky);
  const mode = z.enum(["discord", "roblox", "blocky", "both"]).parse(input.mode);
  const displayName = z.string().trim().min(2).max(32).parse(input.displayName);
  if (levelFromXp(me.xp) < HAT_UNLOCKS[blocky.hat]) throw new Error("That hat is still locked");
  const sb = await createClient();
  const { error } = await sb.from("profiles").update({ blocky, avatar_mode: mode, display_name: displayName }).eq("id", me.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
