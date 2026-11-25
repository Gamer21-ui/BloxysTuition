import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { levelFromXp } from "@/lib/xp";
import { ShopGrid, type Item } from "./shop-grid";
import { unlockLevel } from "@/lib/prestige";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function Shop() {
  const me = await requireApproved();
  const sb = await createClient();
  const [{ data: items }, { data: mine }] = await Promise.all([
    // season rewards are hidden until you own them (the database only returns owned ones).
    // If the seasons database update hasn't been run yet, fall back to the older columns so the shop still loads.
    sb.from("shop_items").select("id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only, active, reward_only").order("sort")
      .then(async (r) => (r.error ? await sb.from("shop_items").select("id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only, active").eq("active", true).order("sort") as unknown as typeof r : r)),
    sb.from("user_items").select("item_id").eq("user_id", me.id),
  ]);
  const ownedIds = new Set((mine || []).map((m) => m.item_id));
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Shop</h1>
      <p className="text-muted">Spend coins on cosmetics. Nothing here gives XP or an advantage, it just looks cool. Earn coins from quizzes, battles, homework, classes and quests.</p>
      <ShopGrid
        items={((items as Item[]) || []).filter((i) => (i.reward_only ? ownedIds.has(i.id) : i.active || (i.tutor_only && me.role === "tutor")))}
        owned={(mine || []).map((m) => m.item_id)}
        me={{
          id: me.id, name: me.display_name, coins: me.coins, level: unlockLevel(me.xp, me.prestige ?? 0), title: me.title, nameStyle: me.name_style,
          frame: me.frame, blocky: me.blocky, avatarMode: me.avatar_mode, discordUrl: me.discord_avatar_url, robloxUrl: me.roblox_headshot_url,
          freezes: me.streak_freezes, streak: me.streak,
        }}
      />
    </div>
  );
}
