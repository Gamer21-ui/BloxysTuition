"use client";
import { useEffect, useState } from "react";

/** Live "6d 04h 12m 09s" countdown to a date. */
export function Countdown({ to, className }: { to: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (now === null) return <span className={className}>…</span>;
  const ms = Math.max(0, +new Date(to) - now);
  const d = Math.floor(ms / 86400_000), h = Math.floor(ms / 3600_000) % 24, m = Math.floor(ms / 60_000) % 60, s = Math.floor(ms / 1000) % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return <span className={className} suppressHydrationWarning>{d}d {p(h)}h {p(m)}m {p(s)}s</span>;
}
