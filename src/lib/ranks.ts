// Ranked battle tiers by rating (everyone starts at 1000 = Silver).
export const RANKS = [
  { min: 1600, name: "Champion", emoji: "👑", color: "#f43f5e" },
  { min: 1400, name: "Diamond", emoji: "💎", color: "#38bdf8" },
  { min: 1250, name: "Platinum", emoji: "🔷", color: "#2dd4bf" },
  { min: 1100, name: "Gold", emoji: "🥇", color: "#f59e0b" },
  { min: 1000, name: "Silver", emoji: "🥈", color: "#94a3b8" },
  { min: 0, name: "Bronze", emoji: "🥉", color: "#b45309" },
];
export const rankOf = (rating: number) => RANKS.find((r) => rating >= r.min)!;
/** Points needed for the next tier, or null at the top. */
export function nextRank(rating: number) {
  const i = RANKS.findIndex((r) => rating >= r.min);
  return i > 0 ? { ...RANKS[i - 1], need: RANKS[i - 1].min - rating } : null;
}
export const STYLES = {
  classic: { label: "Classic", emoji: "⚔️", blurb: "Normal battle. 20 seconds a round." },
  ranked: { label: "Ranked", emoji: "🏆", blurb: "Win to gain rating and climb from Bronze to Champion. Lose and you drop. At least 5 rounds, no single chapters." },
  pressure: { label: "Pressure", emoji: "⚡", blurb: "Every time someone answers, everyone else's time is cut in half. Think fast!" },
} as const;
export type Style = keyof typeof STYLES;
