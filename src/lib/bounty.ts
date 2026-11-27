// 🎯 Bounty rules (must match bounty_settle in the database).
/** What you get for ending someone's streak: +2.5% XP per streak win (max 50%) and 250 coins per 5 wins. */
export const bountyOf = (streak: number) => ({ pct: Math.min(streak * 2.5, 50), coins: Math.floor(streak / 5) * 250 });
/** The streaker's own bonus on each win while on 3+: +2% XP per streak win (max 20%). */
export const hotPct = (streak: number) => (streak >= 3 ? Math.min(streak * 2, 20) : 0);
export const WANTED_AT = 3;
