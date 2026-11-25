/** Total XP needed to reach level L: 40 * L * (L - 1). Mirrors level_from_xp() in SQL. */
export function xpForLevel(level: number) {
  return 40 * level * (level - 1);
}

export function levelFromXp(xp: number) {
  return Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * xp) / 40)) / 2));
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const start = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - start, needed: next - start, pct: Math.min(100, ((xp - start) / (next - start)) * 100) };
}

/** XP boost for studying above your tier: +0.25x per tier jumped. */
export function tierBoost(studentTier: string, contentTier: string) {
  const rank: Record<string, number> = { O: 0, AS: 1, A: 2 };
  return 1 + 0.25 * Math.max(0, (rank[contentTier] ?? 0) - (rank[studentTier] ?? 0));
}

export const RANKS = [
  { min: 1, name: "Noob" },
  { min: 3, name: "Apprentice" },
  { min: 6, name: "Grinder" },
  { min: 10, name: "Pro" },
  { min: 15, name: "Elite" },
  { min: 20, name: "Legend" },
  { min: 30, name: "Mythic" },
];

export function rankName(level: number) {
  return [...RANKS].reverse().find((r) => level >= r.min)?.name ?? "Noob";
}
