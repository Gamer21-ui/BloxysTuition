"use client";
import { motion } from "framer-motion";

/**
 * The Black Market seller: an original blocky figure in a fedora, shades and a long trench coat.
 * When `open`, BOTH sides of the coat swing out like doors and his hands hold the edges,
 * showing the goods pinned to the red lining.
 */
const SPRING = { type: "spring", stiffness: 140, damping: 15 } as const;

export function ShadySeller({ open = false, size = 220, talking = false }: { open?: boolean; size?: number; talking?: boolean }) {
  return (
    <motion.svg viewBox="0 0 200 260" width={size} height={size * 1.3} role="img" aria-label="A shady figure in a trench coat and fedora" style={{ overflow: "visible" }}
      animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
      <ellipse cx="100" cy="250" rx="66" ry="8" fill="#000" opacity="0.35" />
      {/* legs */}
      <rect x="76" y="196" width="22" height="50" fill="#2b2f36" />
      <rect x="102" y="196" width="22" height="50" fill="#2b2f36" />
      <rect x="72" y="240" width="28" height="10" rx="2" fill="#111" />
      <rect x="100" y="240" width="28" height="10" rx="2" fill="#111" />
      {/* coat back (behind everything) */}
      <path d="M58 92 L142 92 L150 226 L50 226 Z" fill="#101216" />
      {/* shirt + tie */}
      <rect x="70" y="96" width="60" height="100" fill="#d9dde3" />
      <polygon points="100,98 94,108 100,172 106,108" fill="#7f1d1d" />
      <rect x="70" y="150" width="60" height="7" fill="#0b0c0f" />

      {/* ---- arms: swing out to hold the coat edges open */}
      <motion.g initial={false} animate={{ rotate: open ? 34 : 0 }} transition={SPRING} style={{ originX: 0.5, originY: 0 }}>
        <rect x="42" y="94" width="20" height="72" rx="2" fill="#1c1f26" stroke="#000" strokeWidth="2" />
        <rect x="44" y="164" width="16" height="16" rx="2" fill="#e8c9a6" stroke="#000" strokeWidth="1.5" />
      </motion.g>
      <motion.g initial={false} animate={{ rotate: open ? -34 : 0 }} transition={SPRING} style={{ originX: 0.5, originY: 0 }}>
        <rect x="138" y="94" width="20" height="72" rx="2" fill="#16181d" stroke="#000" strokeWidth="2" />
        <rect x="140" y="164" width="16" height="16" rx="2" fill="#e8c9a6" stroke="#000" strokeWidth="1.5" />
      </motion.g>

      {/* ---- LEFT lining (swings out from the left edge of the coat) */}
      <motion.g initial={false} animate={{ scaleX: open ? 1 : 0, opacity: open ? 1 : 0 }} transition={SPRING} style={{ originX: 1, originY: 0.5 }}>
        <path d="M58 94 L14 104 L10 220 L52 226 Z" fill="#5b0f0f" stroke="#000" strokeWidth="2" />
        <path d="M54 98 L18 107 L15 216 L49 221 Z" fill="#7f1d1d" />
        <g transform="rotate(-8 34 128)">
          <rect x="18" y="116" width="34" height="24" rx="3" fill="#facc15" stroke="#422006" strokeWidth="1.5" />
          <text x="35" y="132" textAnchor="middle" fontSize="9" fontWeight="900" fill="#422006">BUNK</text>
        </g>
        <g transform="rotate(5 33 168)">
          <rect x="16" y="156" width="36" height="24" rx="3" fill="#f3f4f6" stroke="#111" strokeWidth="1.5" />
          <text x="34" y="171" textAnchor="middle" fontSize="7.5" fontWeight="900" fill="#111">SKIP HW</text>
        </g>
        <circle cx="35" cy="113" r="2" fill="#d1d5db" /><circle cx="34" cy="153" r="2" fill="#d1d5db" />
      </motion.g>
      {/* ---- RIGHT lining */}
      <motion.g initial={false} animate={{ scaleX: open ? 1 : 0, opacity: open ? 1 : 0 }} transition={SPRING} style={{ originX: 0, originY: 0.5 }}>
        <path d="M142 94 L186 104 L190 220 L148 226 Z" fill="#5b0f0f" stroke="#000" strokeWidth="2" />
        <path d="M146 98 L182 107 L185 216 L151 221 Z" fill="#7f1d1d" />
        <g transform="rotate(7 166 130)">
          <rect x="150" y="118" width="34" height="24" rx="3" fill="#22c55e" stroke="#052e16" strokeWidth="1.5" />
          <text x="167" y="134" textAnchor="middle" fontSize="9" fontWeight="900" fill="#052e16">???</text>
        </g>
        <g transform="rotate(-5 166 170)">
          <rect x="150" y="158" width="34" height="24" rx="3" fill="#a855f7" stroke="#2e1065" strokeWidth="1.5" />
          <text x="167" y="174" textAnchor="middle" fontSize="8" fontWeight="900" fill="#fff">VIP</text>
        </g>
        <circle cx="166" cy="115" r="2" fill="#d1d5db" /><circle cx="166" cy="155" r="2" fill="#d1d5db" />
      </motion.g>

      {/* ---- coat fronts (fold away when open) */}
      <motion.path d="M100 92 L60 92 L52 226 L96 226 Z" fill="#1c1f26" stroke="#000" strokeWidth="2"
        initial={false} animate={{ scaleX: open ? 0.12 : 1 }} transition={SPRING} style={{ originX: 0, originY: 0.5 }} />
      <motion.path d="M100 92 L140 92 L148 226 L104 226 Z" fill="#16181d" stroke="#000" strokeWidth="2"
        initial={false} animate={{ scaleX: open ? 0.12 : 1 }} transition={SPRING} style={{ originX: 1, originY: 0.5 }} />
      {/* belt across the closed coat */}
      <motion.rect x="56" y="150" width="88" height="8" fill="#0b0c0f" initial={false} animate={{ opacity: open ? 0 : 1 }} />
      {/* collar */}
      <polygon points="66,86 100,104 82,112 60,92" fill="#0f1115" />
      <polygon points="134,86 100,104 118,112 140,92" fill="#0f1115" />

      {/* hands gripping the open coat edges (on top) */}
      <motion.g initial={false} animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.6 }} transition={SPRING}>
        <rect x="4" y="150" width="15" height="15" rx="2" fill="#e8c9a6" stroke="#000" strokeWidth="1.5" />
        <rect x="181" y="150" width="15" height="15" rx="2" fill="#e8c9a6" stroke="#000" strokeWidth="1.5" />
      </motion.g>
      {/* ---- head */}
      <rect x="72" y="40" width="56" height="52" rx="4" fill="#e8c9a6" stroke="#000" strokeWidth="2" />
      <rect x="76" y="58" width="22" height="10" rx="2" fill="#0b0c0f" />
      <rect x="102" y="58" width="22" height="10" rx="2" fill="#0b0c0f" />
      <rect x="96" y="61" width="8" height="3" fill="#0b0c0f" />
      <rect x="80" y="60" width="6" height="2" fill="#4b5563" />
      {talking
        ? <motion.ellipse cx="102" cy="80" rx="7" fill="#3f2a1d" animate={{ ry: [1.5, 4, 1.5] }} transition={{ repeat: Infinity, duration: 0.35 }} />
        : <path d="M92 80 Q104 85 112 77" stroke="#3f2a1d" strokeWidth="3" fill="none" strokeLinecap="round" />}
      {/* fedora */}
      <ellipse cx="100" cy="44" rx="50" ry="8" fill="#111318" />
      <path d="M74 44 L78 16 Q100 8 122 16 L126 44 Z" fill="#1a1d23" />
      <rect x="76" y="34" width="48" height="7" fill="#7f1d1d" />
      <path d="M90 16 Q100 22 110 16" stroke="#0b0c0f" strokeWidth="3" fill="none" />
    </motion.svg>
  );
}
