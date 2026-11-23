// Visuals for shop cosmetics. Prices, levels and ownership live in the database (shop_items);
// this file only says how each item code looks.
import type { CSSProperties } from "react";

export const NAME_STYLES: Record<string, CSSProperties> = {
  ocean: { color: "#0ea5e9" },
  lime: { color: "#65a30d" },
  sunset: { backgroundImage: "linear-gradient(90deg,#f97316,#ec4899)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  gold: { backgroundImage: "linear-gradient(90deg,#b45309,#facc15,#b45309)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
  owner: {}, // animated: see .fb-owner-name in globals.css
  rainbow: { backgroundImage: "linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" },
};

export const FRAMES: Record<string, string> = {
  bronze: "linear-gradient(135deg,#92400e,#fcd34d,#92400e)",
  silver: "linear-gradient(135deg,#6b7280,#f9fafb,#6b7280)",
  gold: "linear-gradient(135deg,#a16207,#fde047,#ca8a04,#fef08a)",
  fire: "linear-gradient(0deg,#dc2626,#f97316,#facc15)",
  diamond: "linear-gradient(135deg,#67e8f9,#e0f2fe,#a78bfa,#67e8f9)",
  owner: "", // animated: see .fb-owner-frame in globals.css
};

export const SHOP_HATS = ["wizard", "cowboy", "beanie", "party", "chef", "ninja", "owner_crown"] as const;
export const PATTERNS = ["stars", "checker", "stripes", "grass", "galaxy", "owner"] as const;

export const nameStyle = (code: string | null | undefined): CSSProperties | undefined => (code ? NAME_STYLES[code] : undefined);
