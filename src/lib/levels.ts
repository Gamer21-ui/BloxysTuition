// Study levels shown as tabs on every page that lists subjects.
// "A" groups AS and A Level, since they are one Cambridge qualification.
export type LevelId = "O" | "A";
export const LEVELS: { id: LevelId; label: string; tiers: string[] }[] = [
  { id: "O", label: "O Level", tiers: ["O"] },
  { id: "A", label: "AS & A Level", tiers: ["AS", "A"] },
];
export const levelOfTier = (tier: string | null | undefined): LevelId => (tier === "AS" || tier === "A" ? "A" : "O");
/** The level picked in the URL (?level=O|A), or the student's own level. */
export const pickLevel = (param: string | string[] | undefined, myTier?: string | null): LevelId =>
  param === "O" || param === "A" ? param : levelOfTier(myTier);
export const inLevel = (tier: string, level: LevelId) => LEVELS.find((l) => l.id === level)!.tiers.includes(tier);
/** Group items with a `tier` into [{level, items}] for <optgroup>s, skipping empty levels. */
export function groupByLevel<T extends { tier: string }>(items: T[]) {
  return LEVELS.map((l) => ({ level: l, items: items.filter((i) => l.tiers.includes(i.tier)) })).filter((g) => g.items.length);
}
