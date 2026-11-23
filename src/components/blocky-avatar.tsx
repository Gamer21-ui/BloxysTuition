import type { BlockyConfig } from "@/lib/types";

export const BLOCKY_DEFAULT: Required<BlockyConfig> = {
  skin: "#f5c89a", shirt: "#1cb0f6", pants: "#334155", face: "smile", hat: "none", bg: "#58cc02", pattern: "none",
};

/** Free hats unlock with level (shown as locked in the editor until reached). Shop hats are bought with coins. */
export const HAT_UNLOCKS: Partial<Record<NonNullable<BlockyConfig["hat"]>, number>> = {
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
    case "owner_crown":
      return (<g>
        <path d="M24 24 L27 4 L38 14 L50 0 L62 14 L73 4 L76 24 Z" fill="#facc15" stroke="#a16207" strokeWidth="2" strokeLinejoin="round" />
        <rect x="24" y="20" width="52" height="6" fill="#eab308" stroke="#a16207" strokeWidth="1.5" />
        <circle cx="50" cy="12" r="3.6" fill="#ef4444" stroke="#7f1d1d" />
        <circle cx="36" cy="18" r="2.6" fill="#3b82f6" stroke="#1e3a8a" />
        <circle cx="64" cy="18" r="2.6" fill="#22c55e" stroke="#14532d" />
        <circle cx="27" cy="4" r="2.2" fill="#fef9c3" /><circle cx="50" cy="1.5" r="2.2" fill="#fef9c3" /><circle cx="73" cy="4" r="2.2" fill="#fef9c3" />
        <path d="M84 8 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5 z" fill="#fde68a" />
      </g>);
    case "wizard":
      return (<g><path d="M30 22 L52 0 L70 22 Z" fill="#6d28d9" /><rect x="24" y="18" width="52" height="6" rx="2" fill="#4c1d95" /><circle cx="50" cy="12" r="3" fill="#facc15" /><circle cx="58" cy="17" r="1.6" fill="#fde68a" /></g>);
    case "cowboy":
      return (<g><ellipse cx="50" cy="20" rx="31" ry="5" fill="#92400e" /><rect x="36" y="4" width="28" height="17" rx="5" fill="#b45309" /><rect x="36" y="13" width="28" height="3" fill="#451a03" /></g>);
    case "beanie":
      return (<g><path d="M29 24 q0 -20 21 -20 q21 0 21 20 z" fill="#ef4444" /><rect x="28" y="19" width="44" height="7" rx="2" fill="#b91c1c" /><circle cx="50" cy="5" r="5" fill="#f8fafc" /></g>);
    case "party":
      return (<g><path d="M38 21 L50 2 L62 21 Z" fill="#ec4899" /><path d="M41 16 L59 16 M44 10 L56 10" stroke="#fde047" strokeWidth="2.5" /><circle cx="50" cy="3" r="3.5" fill="#22d3ee" /></g>);
    case "chef":
      return (<g><circle cx="40" cy="10" r="9" fill="#fff" stroke="#e5e7eb" /><circle cx="60" cy="10" r="9" fill="#fff" stroke="#e5e7eb" /><circle cx="50" cy="7" r="10" fill="#fff" stroke="#e5e7eb" /><rect x="33" y="13" width="34" height="9" fill="#f8fafc" stroke="#e5e7eb" /></g>);
    case "ninja":
      return (<g><rect x="29" y="21" width="42" height="7" fill="#111827" /><path d="M71 22 l13 -5 l-2 7 z" fill="#111827" /><path d="M71 26 l12 5 l-5 3 z" fill="#111827" /></g>);
    case "viking":
      return (<g><path d="M28 22 q0 -18 22 -18 q22 0 22 18z" fill="#94a3b8" /><path d="M28 18 q-10 -4 -10 -16 q8 6 14 8z" fill="#f8fafc" /><path d="M72 18 q10 -4 10 -16 q-8 6 -14 8z" fill="#f8fafc" /></g>);
    default:
      return null;
  }
}

function Pattern({ pattern }: { pattern: BlockyConfig["pattern"] }) {
  switch (pattern) {
    case "stars":
      return (<g fill="#fff" opacity="0.75">{[[12, 14], [86, 10], [80, 40], [14, 50], [90, 70], [8, 84], [70, 90], [28, 30]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z`} />)}</g>);
    case "checker":
      return (<g fill="#000" opacity="0.14">{Array.from({ length: 25 }, (_, i) => <rect key={i} x={(i % 5) * 20 + (Math.floor(i / 5) % 2 ? 10 : 0)} y={Math.floor(i / 5) * 20} width="10" height="10" />)}{Array.from({ length: 25 }, (_, i) => <rect key={"b" + i} x={(i % 5) * 20 + (Math.floor(i / 5) % 2 ? 0 : 10)} y={Math.floor(i / 5) * 20 + 10} width="10" height="10" />)}</g>);
    case "stripes":
      return (<g stroke="#fff" strokeWidth="6" opacity="0.2">{Array.from({ length: 10 }, (_, i) => <line key={i} x1={i * 22 - 100} y1="0" x2={i * 22} y2="100" />)}</g>);
    case "grass":
      return (<g><rect width="100" height="100" fill="#7dd3fc" /><rect y="74" width="100" height="26" fill="#8b5a2b" /><rect y="70" width="100" height="8" fill="#4ade80" />{[4, 18, 30, 44, 58, 72, 88].map((x) => <rect key={x} x={x} y="78" width="6" height="5" fill="#4ade80" />)}<rect x="10" y="10" width="14" height="8" fill="#fff" opacity="0.9" /><rect x="66" y="18" width="18" height="8" fill="#fff" opacity="0.9" /></g>);
    case "owner":
      return (<g><defs><radialGradient id="fb-owner-bg" cx="50%" cy="35%" r="75%"><stop offset="0" stopColor="#9333ea" /><stop offset="0.6" stopColor="#581c87" /><stop offset="1" stopColor="#2e1065" /></radialGradient></defs>
        <rect width="100" height="100" fill="url(#fb-owner-bg)" />
        <rect x="2" y="2" width="96" height="96" fill="none" stroke="#facc15" strokeWidth="3" />
        {[[12, 14], [86, 12], [84, 46], [14, 52], [90, 84], [8, 86], [24, 32], [76, 28]].map(([x, y], i) => <path key={i} d={`M${x} ${y - 3.5} L${x + 1} ${y - 1} L${x + 3.5} ${y} L${x + 1} ${y + 1} L${x} ${y + 3.5} L${x - 1} ${y + 1} L${x - 3.5} ${y} L${x - 1} ${y - 1} Z`} fill="#fde68a" />)}
      </g>);
    case "galaxy":
      return (<g><defs><radialGradient id="fb-galaxy" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#7c3aed" /><stop offset="0.55" stopColor="#1e1b4b" /><stop offset="1" stopColor="#020617" /></radialGradient></defs><rect width="100" height="100" fill="url(#fb-galaxy)" />{[[10, 12], [84, 8], [76, 36], [18, 46], [92, 66], [6, 80], [64, 92], [40, 6]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.8} fill="#fff" />)}</g>);
    default:
      return null;
  }
}

export function BlockyAvatar({ config, size = 64, className }: { config?: BlockyConfig; size?: number; className?: string }) {
  const c = { ...BLOCKY_DEFAULT, ...(config || {}) };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label="Blocky avatar">
      <rect width="100" height="100" fill={c.bg} />
      <Pattern pattern={c.pattern} />
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
