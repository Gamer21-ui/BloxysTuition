import type { BlockyConfig } from "@/lib/types";

export const BLOCKY_DEFAULT: Required<BlockyConfig> = {
  skin: "#f5c89a", shirt: "#1cb0f6", pants: "#334155", face: "smile", hat: "none", bg: "#58cc02",
};

/** Hats unlock with level (shown as locked in the editor until reached). */
export const HAT_UNLOCKS: Record<NonNullable<BlockyConfig["hat"]>, number> = {
  none: 1, cap: 1, headphones: 3, tophat: 5, viking: 8, halo: 12, crown: 15,
};

function Face({ face }: { face: BlockyConfig["face"] }) {
  const eye = "#1e293b";
  switch (face) {
    case "cool":
      return (<g><rect x="35" y="30" width="30" height="7" rx="2" fill={eye} /><path d="M41 45 q9 6 18 0" stroke={eye} strokeWidth="3" fill="none" strokeLinecap="round" /></g>);
    case "wink":
      return (<g><rect x="39" y="30" width="5" height="7" rx="2" fill={eye} /><path d="M55 34 h7" stroke={eye} strokeWidth="3" strokeLinecap="round" /><path d="M41 44 q9 7 18 0" stroke={eye} strokeWidth="3" fill="none" strokeLinecap="round" /></g>);
    case "grin":
      return (<g><rect x="39" y="29" width="5" height="8" rx="2" fill={eye} /><rect x="56" y="29" width="5" height="8" rx="2" fill={eye} /><path d="M39 42 h22 q-2 10 -11 10 q-9 0 -11 -10z" fill={eye} /><rect x="42" y="42" width="16" height="3" fill="#fff" /></g>);
    case "focused":
      return (<g><path d="M37 28 l9 3" stroke={eye} strokeWidth="3" strokeLinecap="round" /><path d="M63 28 l-9 3" stroke={eye} strokeWidth="3" strokeLinecap="round" /><rect x="40" y="33" width="5" height="5" rx="1" fill={eye} /><rect x="55" y="33" width="5" height="5" rx="1" fill={eye} /><path d="M43 47 h14" stroke={eye} strokeWidth="3" strokeLinecap="round" /></g>);
    default:
      return (<g><rect x="39" y="30" width="5" height="8" rx="2" fill={eye} /><rect x="56" y="30" width="5" height="8" rx="2" fill={eye} /><path d="M41 44 q9 8 18 0" stroke={eye} strokeWidth="3" fill="none" strokeLinecap="round" /></g>);
  }
}

function Hat({ hat }: { hat: BlockyConfig["hat"] }) {
  switch (hat) {
    case "cap":
      return (<g><rect x="27" y="10" width="46" height="12" rx="6" fill="#ef4444" /><rect x="60" y="18" width="24" height="5" rx="2" fill="#b91c1c" /></g>);
    case "crown":
      return (<path d="M28 20 l6 -16 l9 10 l7 -12 l7 12 l9 -10 l6 16z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />);
    case "tophat":
      return (<g><rect x="34" y="-2" width="32" height="20" fill="#111827" /><rect x="26" y="16" width="48" height="5" fill="#111827" /><rect x="34" y="11" width="32" height="4" fill="#dc2626" /></g>);
    case "headphones":
      return (<g><path d="M24 34 q0 -30 26 -30 q26 0 26 30" stroke="#111827" strokeWidth="5" fill="none" /><rect x="18" y="28" width="10" height="16" rx="3" fill="#a855f7" /><rect x="72" y="28" width="10" height="16" rx="3" fill="#a855f7" /></g>);
    case "halo":
      return (<ellipse cx="50" cy="6" rx="18" ry="5" fill="none" stroke="#fde047" strokeWidth="4" />);
    case "viking":
      return (<g><path d="M28 22 q0 -18 22 -18 q22 0 22 18z" fill="#94a3b8" /><path d="M28 18 q-10 -4 -10 -16 q8 6 14 8z" fill="#f8fafc" /><path d="M72 18 q10 -4 10 -16 q-8 6 -14 8z" fill="#f8fafc" /></g>);
    default:
      return null;
  }
}

export function BlockyAvatar({ config, size = 64, className }: { config?: BlockyConfig; size?: number; className?: string }) {
  const c = { ...BLOCKY_DEFAULT, ...(config || {}) };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Blocky avatar">
      <rect width="100" height="100" fill={c.bg} />
      {/* legs */}
      <rect x="36" y="82" width="13" height="18" fill={c.pants} />
      <rect x="51" y="82" width="13" height="18" fill={c.pants} />
      {/* arms */}
      <rect x="18" y="58" width="13" height="26" fill={c.shirt} />
      <rect x="69" y="58" width="13" height="26" fill={c.shirt} />
      <rect x="18" y="80" width="13" height="6" fill={c.skin} />
      <rect x="69" y="80" width="13" height="6" fill={c.skin} />
      {/* torso */}
      <rect x="31" y="56" width="38" height="28" fill={c.shirt} />
      <rect x="31" y="56" width="38" height="5" fill="rgb(0 0 0 / 0.12)" />
      {/* head */}
      <rect x="29" y="14" width="42" height="42" rx="7" fill={c.skin} />
      <Face face={c.face} />
      <Hat hat={c.hat} />
    </svg>
  );
}
