"use client";
import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#58cc02", "#1cb0f6", "#ffc800", "#ff4b4b", "#a855f7", "#f97316"];

/** Lightweight block-confetti burst. */
export function Confetti({ count = 40 }: { count?: number }) {
  const bits = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 700, y: -(Math.random() * 380 + 120), r: Math.random() * 720 - 360,
      c: COLORS[i % COLORS.length], s: 6 + Math.random() * 8, d: Math.random() * 0.15,
    })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden" aria-hidden="true">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{ width: b.s, height: b.s, background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 600], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 1.8, delay: b.d, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
