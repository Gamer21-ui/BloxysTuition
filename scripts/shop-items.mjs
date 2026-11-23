// Coin shop catalogue. Prices are what students pay; an active student earns roughly 30–60 coins a day
// (quizzes 5, battles 3–10, homework 10, classes 5, quests 5–25). Visuals live in src/lib/cosmetics.ts.
// Re-running the seed adds new items and updates names/descriptions, but never changes prices
// or on/off settings you edited in Tutor → Shop.
export const SHOP_ITEMS = [
  // hats (blocky avatar)
  { code: "beanie", kind: "hat", name: "Cosy Beanie", price: 150, rarity: "common", description: "Warm head, cool vibes." },
  { code: "party", kind: "hat", name: "Party Hat", price: 150, rarity: "common", description: "Every quiz is a celebration." },
  { code: "cowboy", kind: "hat", name: "Cowboy Hat", price: 200, rarity: "common", description: "Yeehaw, ledgers." },
  { code: "chef", kind: "hat", name: "Chef's Toque", price: 200, rarity: "common", description: "Cooking up A*s." },
  { code: "wizard", kind: "hat", name: "Wizard Hat", price: 300, rarity: "rare", min_level: 3, description: "Turns MCQs into magic." },
  { code: "ninja", kind: "hat", name: "Ninja Band", price: 350, rarity: "rare", min_level: 4, description: "Silent. Fast. Correct." },
  // backgrounds
  { code: "stars", kind: "pattern", name: "Starry", price: 150, rarity: "common", description: "Sparkly background." },
  { code: "checker", kind: "pattern", name: "Checkerboard", price: 150, rarity: "common", description: "Retro squares." },
  { code: "stripes", kind: "pattern", name: "Speed Stripes", price: 150, rarity: "common", description: "Looks fast, is fast." },
  { code: "grass", kind: "pattern", name: "Grass Block", price: 250, rarity: "rare", description: "Touch grass (digitally)." },
  { code: "galaxy", kind: "pattern", name: "Galaxy", price: 450, rarity: "epic", min_level: 5, description: "Big brain, bigger universe." },
  // avatar frames
  { code: "bronze", kind: "frame", name: "Bronze Frame", price: 200, rarity: "common" },
  { code: "silver", kind: "frame", name: "Silver Frame", price: 350, rarity: "rare", min_level: 3 },
  { code: "fire", kind: "frame", name: "Fire Frame", price: 600, rarity: "epic", min_level: 6, description: "On a streak? Show it." },
  { code: "gold", kind: "frame", name: "Gold Frame", price: 700, rarity: "epic", min_level: 8 },
  { code: "diamond", kind: "frame", name: "Diamond Frame", price: 1200, rarity: "legendary", min_level: 12 },
  // name colours
  { code: "ocean", kind: "name_style", name: "Ocean Blue", price: 150, rarity: "common" },
  { code: "lime", kind: "name_style", name: "Lime Green", price: 150, rarity: "common" },
  { code: "sunset", kind: "name_style", name: "Sunset", price: 350, rarity: "rare", min_level: 3 },
  { code: "gold", kind: "name_style", name: "Golden Name", price: 600, rarity: "epic", min_level: 6 },
  { code: "rainbow", kind: "name_style", name: "Rainbow", price: 1000, rarity: "legendary", min_level: 10 },
  // titles
  { code: "t-ledger", kind: "title", name: "Ledger Legend", price: 120, rarity: "common", data: { text: "Ledger Legend" } },
  { code: "t-demand", kind: "title", name: "Supply & Demand Slayer", price: 120, rarity: "common", data: { text: "Supply & Demand Slayer" } },
  { code: "t-binary", kind: "title", name: "Binary Boss", price: 120, rarity: "common", data: { text: "Binary Boss" } },
  { code: "t-tycoon", kind: "title", name: "Business Tycoon", price: 120, rarity: "common", data: { text: "Business Tycoon" } },
  { code: "t-exam", kind: "title", name: "Exam Destroyer", price: 300, rarity: "rare", min_level: 5, data: { text: "Exam Destroyer" } },
  { code: "t-comeback", kind: "title", name: "The Comeback Kid", price: 500, rarity: "epic", min_level: 8, data: { text: "The Comeback Kid" } },
  // power-ups
  { code: "streak-freeze", kind: "streak_freeze", name: "Streak Freeze", price: 80, rarity: "rare", description: "Saves your streak if you miss a day. Hold up to 2." },
];
