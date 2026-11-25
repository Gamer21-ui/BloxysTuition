import { emblem } from "@/lib/prestige";

/** Small "⭐ P2" / "💠 MASTER" chip. Renders nothing for prestige 0. */
export function PrestigeBadge({ n, className = "" }: { n?: number | null; className?: string }) {
  if (!n) return null;
  const e = emblem(n);
  return (
    <span className={`inline-flex items-center rounded px-1 text-[0.85em] font-bold leading-tight ${className}`}
      style={{ color: e.color, border: `1.5px solid ${e.color}`, background: e.color + "22" }} title={`Prestige ${n}`}>{e.label}</span>
  );
}
