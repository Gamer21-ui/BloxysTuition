import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui";
import { updateShopItem } from "../actions";

export const metadata: Metadata = { title: "Shop (tutor)" };
export const dynamic = "force-dynamic";

const KIND: Record<string, string> = { hat: "Hat", pattern: "Background", frame: "Frame", name_style: "Name colour", title: "Title", streak_freeze: "Power-up" };

export default async function TutorShop() {
  await requireTutor();
  const admin = createAdminClient();
  const [{ data: items }, { data: owned }, { data: spend }] = await Promise.all([
    admin.from("shop_items").select("*").order("sort"),
    admin.from("user_items").select("item_id"),
    admin.from("xp_events").select("coins").eq("reason", "shop"),
  ]);
  const sold = (id: string) => (owned || []).filter((o) => o.item_id === id).length;
  const totalSpent = -(spend || []).reduce((s, e) => s + e.coins, 0);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">Shop</h1>
      <p className="text-muted">Change prices, level locks, or switch items off. Students have spent <b>{totalSpent.toLocaleString()}</b> coins so far. Prices you set here are never overwritten by updates.</p>
      <Card className="mt-4 divide-y divide-line p-0">
        {(items || []).map((it) => (
          <form key={it.id} action={updateShopItem} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm ${it.active ? "" : "opacity-50"}`}>
            <input type="hidden" name="id" value={it.id} />
            <span className="chip w-24 justify-center">{KIND[it.kind]}</span>
            <span className="min-w-[160px] flex-1"><b>{it.name}</b> <span className="text-xs text-muted">{it.rarity} · {it.kind === "streak_freeze" ? "consumable" : `${sold(it.id)} owned`}</span></span>
            <label className="flex items-center gap-1">🪙 <input name="price" type="number" min={0} defaultValue={it.price} className="input h-8 w-20 py-0" aria-label="Price" /></label>
            <label className="flex items-center gap-1">Lv <input name="min_level" type="number" min={1} defaultValue={it.min_level} className="input h-8 w-14 py-0" aria-label="Minimum level" /></label>
            <label className="flex items-center gap-1"><input type="checkbox" name="active" defaultChecked={it.active} /> on sale</label>
            <button className="btn btn-ghost btn-sm">Save</button>
          </form>
        ))}
      </Card>
    </div>
  );
}
