import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

const RARITY: Record<string, [string, string, string]> = {
  common: ["#cbd5e1", "#64748b", "Common"],
  rare: ["#7dd3fc", "#2563eb", "Rare"],
  epic: ["#d8b4fe", "#7c3aed", "Epic"],
  legendary: ["#fde68a", "#f97316", "Legendary"],
};

/** Hexagonal achievement badge. Locked badges are greyed out. */
export function AchievementBadge({ icon, rarity, locked, size = 72, title }: { icon: string; rarity: string; locked?: boolean; size?: number; title: string }) {
  const [a, b] = RARITY[rarity] ?? RARITY.common;
  const id = `g-${icon}-${rarity}-${locked ? "l" : "u"}`;
  return (
    <div className={cn("relative shrink-0", locked && "grayscale opacity-50")} style={{ width: size, height: size }} title={title}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
        </defs>
        <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill={b} />
        <polygon points="50,9 87,30 87,70 50,91 13,70 13,30" fill={`url(#${id})`} />
        <polygon points="50,9 87,30 50,50 13,30" fill="white" opacity="0.18" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-white drop-shadow">
        <Icon name={icon} size={size * 0.38} />
      </div>
    </div>
  );
}

export function rarityLabel(r: string) {
  return (RARITY[r] ?? RARITY.common)[2];
}
