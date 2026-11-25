"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coins, Lock, Snowflake } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { BlockyAvatar } from "@/components/blocky-avatar";
import { NameTag } from "@/components/name-tag";
import type { BlockyConfig, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Item = { id: string; code: string; kind: string; name: string; description: string | null; price: number; rarity: string; min_level: number; data: { text?: string }; sort: number; tutor_only?: boolean; active?: boolean; reward_only?: boolean };
type Me = {
  id: string; name: string; coins: number; level: number; title: string | null; nameStyle: string | null; frame: string | null;
  blocky: BlockyConfig; avatarMode: Profile["avatar_mode"]; discordUrl: string | null; robloxUrl: string | null; freezes: number; streak: number;
};

const TABS = [
  { kind: "hat", label: "Hats" }, { kind: "face_acc", label: "Face" }, { kind: "back", label: "Back" }, { kind: "pattern", label: "Backgrounds" }, { kind: "frame", label: "Frames" },
  { kind: "name_style", label: "Name colours" }, { kind: "title", label: "Titles" }, { kind: "streak_freeze", label: "Power-ups" },
];
const RARITY: Record<string, string> = { common: "text-muted", rare: "text-accent", epic: "text-[#a855f7]", legendary: "text-xp" };

export function ShopGrid({ items, owned, me, powerups = {} }: { items: Item[]; owned: string[]; me: Me; powerups?: Record<string, number> }) {
  const router = useRouter();
  const [tab, setTab] = useState("hat");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const has = (it: Item) => owned.includes(it.id) || !!it.tutor_only; // owner exclusives are free for the tutor
  const equipped = (it: Item) =>
    it.kind === "title" ? me.title === it.data.text : it.kind === "name_style" ? me.nameStyle === it.code : it.kind === "frame" ? me.frame === it.code
      : it.kind === "hat" ? me.blocky?.hat === it.code : it.kind === "pattern" ? me.blocky?.pattern === it.code
      : it.kind === "face_acc" ? me.blocky?.face_acc === it.code : it.kind === "back" ? me.blocky?.back === it.code : false;

  async function run(id: string, fn: "buy_item" | "equip_item", args: Record<string, unknown>, ok: string) {
    setBusy(id); setMsg(null);
    const { error } = await createClient().rpc(fn, args);
    setBusy(null);
    if (error) return setMsg({ text: error.message, bad: true });
    setMsg({ text: ok });
    router.refresh();
  }

  const preview = (it: Item) => {
    const blocky = { ...me.blocky };
    switch (it.kind) {
      case "hat": return <BlockyAvatar config={{ ...blocky, hat: it.code as BlockyConfig["hat"] }} size={88} />;
      case "pattern": return <BlockyAvatar config={{ ...blocky, pattern: it.code as BlockyConfig["pattern"] }} size={88} />;
      case "face_acc": return <BlockyAvatar config={{ ...blocky, face_acc: it.code as BlockyConfig["face_acc"] }} size={88} />;
      case "back": return <BlockyAvatar config={{ ...blocky, back: it.code as BlockyConfig["back"] }} size={88} />;
      case "frame": return <Avatar name={me.name} mode={me.avatarMode} blocky={me.blocky} discordUrl={me.discordUrl} robloxUrl={me.robloxUrl} size={88} frame={it.code} />;
      case "name_style": return <div className="grid h-[88px] min-w-[150px] place-items-center px-2 font-display text-xl"><NameTag name={me.name} style={it.code} /></div>;
      case "title": return <div className="grid h-[88px] min-w-[150px] place-items-center px-2 text-center"><div><div className="font-display">{me.name}</div><div className="text-sm text-muted">{it.data.text}</div></div></div>;
      case "powerup": return <div className="grid h-[88px] min-w-[150px] place-items-center text-5xl" aria-hidden="true">⏳</div>;
      default: return <div className="grid h-[88px] min-w-[150px] place-items-center text-accent"><Snowflake size={52} aria-hidden="true" /></div>;
    }
  };

  // owner exclusives and season rewards first
  const list = items.filter((i) => i.kind === tab || (tab === "streak_freeze" && i.kind === "powerup")).sort((a, b) => Number(!!b.tutor_only || !!b.reward_only) - Number(!!a.tutor_only || !!a.reward_only));
  return (
    <div className="mt-5">
      <div className="sticky top-0 z-10 -mx-2 flex flex-wrap items-center gap-2 bg-bg/90 px-2 py-2 backdrop-blur">
        {TABS.map((t) => <button key={t.kind} onClick={() => setTab(t.kind)} className={cn("btn btn-sm", tab === t.kind ? "btn-primary" : "btn-ghost")}>{t.label}</button>)}
        <span className="chip ml-auto text-base text-coin"><Coins size={16} aria-hidden="true" /> {me.coins.toLocaleString()}</span>
      </div>
      {msg && <p className={cn("mt-3 text-sm font-bold", msg.bad ? "text-bad" : "text-good")} role="status">{msg.text}</p>}
      {tab === "streak_freeze" && <p className="mt-3 text-sm text-muted">You have <b>{me.freezes}/2</b> streak freezes. If you miss a day, one is used automatically so your {me.streak}-day streak survives.
        {items.some((i) => i.kind === "powerup") && <> You have <b>{powerups.extension || 0}/2</b> homework extensions: use one on the Homework page for +48 hours.</>}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((it) => {
          const own = has(it);
          const on = equipped(it);
          const locked = me.level < it.min_level;
          const poor = me.coins < it.price;
          const freeze = it.kind === "streak_freeze";
          const power = it.kind === "powerup";
          const held = powerups[it.code] || 0;
          return (
            <div key={it.id} className={cn("card flex flex-col items-center gap-2 text-center", on && "ring-2 ring-good", it.tutor_only && !on && "ring-2 ring-xp")}>
              <div className="relative">{preview(it)}{locked && <span className="absolute inset-0 grid place-items-center rounded bg-black/55 text-xs font-bold text-white"><span className="flex items-center gap-1"><Lock size={14} aria-hidden="true" /> Lv {it.min_level}</span></span>}</div>
              <div className="font-bold leading-tight">{it.name}</div>
              <div className={cn("text-xs font-bold uppercase", it.tutor_only ? "fb-owner-name" : RARITY[it.rarity])}>{it.tutor_only ? "👑 Owner exclusive" : it.reward_only ? "🏆 Season reward" : it.rarity}</div>
              {it.description && <div className="text-xs text-muted">{it.description}</div>}
              <div className="mt-auto w-full pt-1">
                {freeze || power || !own ? (
                  <button className="btn btn-primary btn-sm w-full" disabled={busy === it.id || locked || poor || (freeze && me.freezes >= 2) || (power && held >= 2)}
                    onClick={() => run(it.id, "buy_item", { p_item: it.id }, freeze ? "Streak freeze added 🧊" : power ? `${it.name} added! Use it on the Homework page.` : `Bought ${it.name}! Equip it below.`)}>
                    <Coins size={14} aria-hidden="true" /> {it.price}
                  </button>
                ) : on ? (
                  <button className="btn btn-ghost btn-sm w-full" disabled={busy === it.id} onClick={() => run(it.id, "equip_item", { p_kind: it.kind, p_code: null }, "Taken off")}>Equipped ✓ (take off)</button>
                ) : (
                  <button className="btn btn-accent btn-sm w-full" disabled={busy === it.id} onClick={() => run(it.id, "equip_item", { p_kind: it.kind, p_code: it.code }, `${it.name} equipped`)}>Equip</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {["hat", "pattern", "face_acc", "back"].includes(tab) && <p className="mt-4 text-xs text-muted">Hats, face items, back items and backgrounds show on your blocky avatar. Pick “Blocky” or “Both” in your Profile to show it off.</p>}
    </div>
  );
}
