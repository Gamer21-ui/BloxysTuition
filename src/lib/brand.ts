/** Rename the platform here. Everything else reads from this file. */
export const BRAND = {
  name: "FunnyBloxy's Academic Comeback!",
  short: "FunnyBloxy",
  tagline: "Level up your O Levels. Literally.",
  description:
    "Private tuition for O Level Accounting, Business, Economics and Computer Science, with lessons, quizzes, XP, streaks and live quiz battles.",
  location: "Mauritius",
};

export const THEMES = [
  { id: "bloxy", label: "Bloxy", hint: "Chunky, bright, Minecraft + Roblox + Duolingo" },
  { id: "gamer", label: "Dark Gamer", hint: "Neon, sharp, esports vibes" },
  { id: "retro", label: "Retro", hint: "Old-school Roblox and classic games" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];
