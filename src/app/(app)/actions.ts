"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { postToDiscord, siteUrl } from "@/lib/discord";
import { levelFromXp, rankName } from "@/lib/xp";
import { HAT_UNLOCKS } from "@/components/blocky-avatar";
import { ownedCodes } from "@/lib/shop";

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
  hat: z.enum(["none", "cap", "crown", "tophat", "headphones", "halo", "viking", "wizard", "cowboy", "beanie", "party", "chef", "ninja", "owner_crown", "fedora", "horns", "frost_crown", "neon_phones", "bunny", "mushroom", "tricorn", "kabuto", "astronaut"]),
  face_acc: z.enum(["none", "shades", "nerd", "eyepatch", "monocle", "laser_visor"]).default("none"),
  back: z.enum(["none", "angel_wings", "demon_wings", "butterfly", "cape", "blade", "jetpack", "shadow_aura"]).default("none"),
  pattern: z.enum(["none", "stars", "checker", "stripes", "grass", "galaxy", "owner"]).default("none"),
});

export async function saveAvatar(input: { mode: string; blocky: unknown; displayName: string }) {
  const me = await requireApproved();
  const blocky = blockySchema.parse(input.blocky);
  const mode = z.enum(["discord", "roblox", "blocky", "both"]).parse(input.mode);
  const displayName = z.string().trim().min(2).max(32).parse(input.displayName);
  const owned = await ownedCodes(me.id, me.role === "tutor");
  const levelHat = HAT_UNLOCKS[blocky.hat];
  if (levelHat !== undefined ? levelFromXp(me.xp) < levelHat : !owned.some((o) => o.kind === "hat" && o.code === blocky.hat)) {
    throw new Error("That hat is still locked");
  }
  if (blocky.pattern !== "none" && !owned.some((o) => o.kind === "pattern" && o.code === blocky.pattern)) throw new Error("You don't own that background");
  if (blocky.face_acc !== "none" && !owned.some((o) => o.kind === "face_acc" && o.code === blocky.face_acc)) throw new Error("You don't own that face item");
  if (blocky.back !== "none" && !owned.some((o) => o.kind === "back" && o.code === blocky.back)) throw new Error("You don't own that back item");
  // students can't write the avatar columns directly, so the server saves them after the checks above
  const { error } = await createAdminClient().from("profiles").update({ blocky, avatar_mode: mode, display_name: displayName }).eq("id", me.id);
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}
