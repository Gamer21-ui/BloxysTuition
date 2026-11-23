export type Tier = "O" | "AS" | "A";
export type PubStatus = "draft" | "locked" | "scheduled" | "published";

export interface Profile {
  id: string;
  discord_id: string | null;
  discord_username: string | null;
  display_name: string;
  discord_avatar_url: string | null;
  role: "student" | "tutor";
  status: "pending" | "approved" | "suspended";
  tier: Tier;
  contact: string | null;
  parent_name: string | null;
  parent_contact: string | null;
  roblox_username: string | null;
  roblox_user_id: number | null;
  roblox_headshot_url: string | null;
  avatar_mode: "discord" | "roblox" | "blocky" | "both";
  blocky: BlockyConfig;
  title: string | null;
  theme: "bloxy" | "gamer" | "retro";
  xp: number;
  coins: number;
  streak: number;
  best_streak: number;
  last_study_date: string | null;
  announced_level: number;
  name_style: string | null;
  frame: string | null;
  streak_freezes: number;
  created_at: string;
}

export interface BlockyConfig {
  skin?: string;
  shirt?: string;
  pants?: string;
  face?: "smile" | "cool" | "wink" | "grin" | "focused";
  hat?: "none" | "cap" | "crown" | "tophat" | "headphones" | "halo" | "viking" | "wizard" | "cowboy" | "beanie" | "party" | "chef" | "ninja";
  pattern?: "none" | "stars" | "checker" | "stripes" | "grass" | "galaxy";
  bg?: string;
}

export interface Card {
  id: string;
  display_name: string;
  avatar_mode: Profile["avatar_mode"];
  discord_avatar_url: string | null;
  roblox_headshot_url: string | null;
  blocky: BlockyConfig;
  title: string | null;
  level: number;
  name_style?: string | null;
  frame?: string | null;
}
