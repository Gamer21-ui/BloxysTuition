"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useAnimationControls } from "framer-motion";

/** Easter egg: tap the "Shop" title 5 times (within 4 s), or find the faint "psst…" at the bottom. From the 3rd tap it starts to wobble. */
export function ShopTitle() {
  const router = useRouter();
  const taps = useRef<number[]>([]);
  const [n, setN] = useState(0);
  const wobble = useAnimationControls();
  return (
    <motion.h1 className="page-title inline-flex cursor-default select-none items-center gap-2" style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
      animate={wobble}
      onClick={() => {
        const now = Date.now();
        taps.current = [...taps.current.filter((t) => now - t < 4000), now];
        setN(taps.current.length);
        if (taps.current.length >= 3) wobble.start({ rotate: [0, -4, 4, -2, 0], transition: { duration: 0.35 } });
        if (taps.current.length >= 5) { taps.current = []; router.push("/black-market"); }
      }}>
      Shop{n >= 3 && n < 5 && <span className="text-2xl">👀</span>}
    </motion.h1>
  );
}
export function SecretDoor() {
  return (
    <div className="mt-16 text-right">
      <Link href="/black-market" className="text-xs text-muted opacity-[0.08] transition hover:opacity-70" aria-label="psst">🕳️ psst… over here</Link>
    </div>
  );
}
