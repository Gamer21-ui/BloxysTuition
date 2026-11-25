"use client";
import { motion } from "framer-motion";

/**
 * The Black Market seller: an original blocky figure in a fedora, shades and a long trench coat
 * that swings open to show what he's selling.
 */
export function ShadySeller({ open = false, size = 220 }: { open?: boolean; size?: number }) {
  return (
    <motion.svg viewBox="0 0 200 260" width={size} height={size * 1.3} role="img" aria-label="A shady figure in a trench coat and fedora"
      animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
      {/* shadow */}
      <ellipse cx="100" cy="250" rx="62" ry="8" fill="#000" opacity="0.35" />
      {/* legs */}
      <rect x="74" y="190" width="24" height="56" fill="#2b2f36" />
      <rect x="102" y="190" width="24" height="56" fill="#2b2f36" />
      <rect x="70" y="240" width="30" height="10" rx="2" fill="#111" />
      <rect x="100" y="240" width="30" height="10" rx="2" fill="#111" />
      {/* shirt + tie under the coat */}
      <rect x="66" y="96" width="68" height="96" fill="#d9dde3" />
      <polygon points="100,98 94,108 100,170 106,108" fill="#7f1d1d" />
      {/* coat inside lining with the goods (visible when open) */}
      <motion.g animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.3 }}>
        <rect x="14" y="96" width="52" height="128" rx="4" fill="#3b0a0a" />
        <rect x="22" y="108" width="36" height="24" rx="3" fill="#facc15" transform="rotate(-6 40 120)" />
        <text x="40" y="124" textAnchor="middle" fontSize="9" fontWeight="800" fill="#422006" transform="rotate(-6 40 120)">BUNK</text>
        <rect x="22" y="142" width="36" height="24" rx="3" fill="#e5e7eb" transform="rotate(4 40 154)" />
        <text x="40" y="157" textAnchor="middle" fontSize="8" fontWeight="800" fill="#111" transform="rotate(4 40 154)">SKIP HW</text>
        <rect x="24" y="176" width="32" height="20" rx="3" fill="#22c55e" />
        <text x="40" y="190" textAnchor="middle" fontSize="9" fontWeight="800" fill="#052e16">⏳ ???</text>
      </motion.g>
      {/* trench coat: right side static, left flap swings open */}
      <path d="M100 92 L138 92 L146 226 L106 226 Z" fill="#16181d" stroke="#000" strokeWidth="2" />
      <motion.path d="M100 92 L62 92 L54 226 L94 226 Z" fill="#1c1f26" stroke="#000" strokeWidth="2"
        style={{ originX: "62px", originY: "92px" }} animate={{ rotateY: open ? 62 : 0, x: open ? -46 : 0 }} transition={{ type: "spring", stiffness: 120, damping: 14 }} />
      {/* collar up */}
      <polygon points="66,86 100,104 82,112 60,92" fill="#0f1115" />
      <polygon points="134,86 100,104 118,112 140,92" fill="#0f1115" />
      {/* belt */}
      <rect x="100" y="150" width="44" height="8" fill="#0b0c0f" />
      {/* arms */}
      <rect x="138" y="96" width="22" height="70" fill="#16181d" stroke="#000" strokeWidth="2" />
      <rect x="140" y="164" width="18" height="16" fill="#e8c9a6" />
      <motion.g animate={{ rotate: open ? -38 : 0 }} style={{ originX: "52px", originY: "98px" }} transition={{ type: "spring", stiffness: 120, damping: 14 }}>
        <rect x="40" y="96" width="22" height="70" fill="#1c1f26" stroke="#000" strokeWidth="2" />
        <rect x="42" y="164" width="18" height="16" fill="#e8c9a6" />
      </motion.g>
      {/* blocky head */}
      <rect x="72" y="40" width="56" height="52" rx="4" fill="#e8c9a6" stroke="#000" strokeWidth="2" />
      {/* shades + smirk */}
      <rect x="76" y="58" width="22" height="10" rx="2" fill="#0b0c0f" />
      <rect x="102" y="58" width="22" height="10" rx="2" fill="#0b0c0f" />
      <rect x="96" y="61" width="8" height="3" fill="#0b0c0f" />
      <rect x="80" y="60" width="6" height="2" fill="#4b5563" />
      <path d="M92 80 Q104 85 112 77" stroke="#3f2a1d" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* fedora */}
      <ellipse cx="100" cy="44" rx="50" ry="8" fill="#111318" />
      <path d="M74 44 L78 16 Q100 8 122 16 L126 44 Z" fill="#1a1d23" />
      <rect x="76" y="34" width="48" height="7" fill="#7f1d1d" />
      <path d="M90 16 Q100 22 110 16" stroke="#0b0c0f" strokeWidth="3" fill="none" />
    </motion.svg>
  );
}
