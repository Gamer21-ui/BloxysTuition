import { levelFromXp } from "@/lib/xp";

export const PRESTIGE_LEVEL = 20;
export const MAX_PRESTIGE = 10;

const COLORS = ["", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e", "#f97316", "#eab308", "#e5e7eb", "#facc15"];
/** The emblem shown next to a student's level. */
export const emblem = (n: number) => (n >= MAX_PRESTIGE ? { label: "💠 MASTER", color: COLORS[10] } : { label: `⭐ P${n}`, color: COLORS[n] || "#a3a3a3" });

/** Level used for shop/hat unlocks: once you've prestiged, everything up to Level 20 stays unlocked. Mirrors unlock_level() in SQL. */
export const unlockLevel = (xp: number, prestige = 0) => (prestige > 0 ? Math.max(levelFromXp(xp), PRESTIGE_LEVEL) : levelFromXp(xp));

export const prestigeCoins = (n: number) => 500 * n;
/** XP multiplier from prestige: +0.15x each. Mirrors award_xp() in SQL. */
export const prestigeBoost = (n: number) => 1 + 0.15 * n;
export function prestigeRewards(n: number) {
  const r = [`a permanent ${prestigeBoost(n).toFixed(2)}× XP boost`, `${prestigeCoins(n)} coins`, n === MAX_PRESTIGE ? "💠 Master Prestige title" : `⭐ Prestige ${n} title`];
  if (n === 1) r.push("Prestige Frame");
  if (n === 5) r.push("Prestige name style");
  if (n === MAX_PRESTIGE) r.push("Master Prestige Frame");
  return r;
}
