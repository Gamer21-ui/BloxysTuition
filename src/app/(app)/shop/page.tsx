import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { levelFromXp } from "@/lib/xp";
import { ShopGrid, type Item } from "./shop-grid";

export const metadata: Metadata = { title: "Shop" };
export const dynamic = "force-dynamic";

export default async function Shop() {
  const me = await requireApproved();
  const sb = await createClient();
  const [{ data: items }, { data: mine }] = await Promise.all([
    sb.from("shop_items").select("id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only").eq("active", true).order("sort"),
    sb.from("user_items").select("item_id").eq("user_id", me.id),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Shop</h1>
      <p className="text-muted">Spend coins on cosmetics. Nothing here gives XP or an advantage, it just looks cool. Earn coins from quizzes, battles, homework, classes and quests.</p>
      <ShopGrid
        items={(items as Item[]) || []}
        owned={(mine || []).map((m) => m.item_id)}
        me={{
          id: me.id, name: me.display_name, coins: me.coins, level: levelFromXp(me.xp), title: me.title, nameStyle: me.name_style,
          frame: me.frame, blocky: me.blocky, avatarMode: me.avatar_mode, discordUrl: me.discord_avatar_url, robloxUrl: me.roblox_headshot_url,
          freezes: me.streak_freezes, streak: me.streak,
        }}
      />
    </div>
  );
}
