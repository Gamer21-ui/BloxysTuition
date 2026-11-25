"use client";
import { useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Easter egg: tap the "Shop" title 5 times quickly, or find the faint "psst…" at the bottom. */
export function ShopTitle() {
  const router = useRouter();
  const taps = useRef<number[]>([]);
  return (
    <h1 className="page-title select-none" onClick={() => {
      const now = Date.now();
      taps.current = [...taps.current.filter((t) => now - t < 2500), now];
      if (taps.current.length >= 5) router.push("/black-market");
    }}>Shop</h1>
  );
}
export function SecretDoor() {
  return (
    <div className="mt-16 text-right">
      <Link href="/black-market" className="text-xs text-muted opacity-[0.08] transition hover:opacity-70" aria-label="psst">🕳️ psst… over here</Link>
    </div>
  );
}
