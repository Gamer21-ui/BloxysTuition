import Link from "next/link";
import type { Game } from "@/lib/arcade";

export function GameCard({ g, wins, paidToday, note }: { g: Game; wins?: number; paidToday?: boolean; note?: string }) {
  return (
    <Link href={`/arcade/${g.slug}`} className="card group block transition hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="text-5xl transition group-hover:scale-110">{g.emoji}</div>
        <span className="chip text-xs">{g.genre}</span>
      </div>
      <h3 className="mt-2 font-display text-2xl">{g.name}</h3>
      <div className="text-xs font-bold text-accent">{g.topic}</div>
      <p className="mt-2 text-sm text-muted">{g.blurb}{note ? ` ${note}` : ""}</p>
      {wins !== undefined && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-muted">🏆 {wins} win{wins === 1 ? "" : "s"}</span>
          {paidToday ? <span className="font-bold text-good">✅ Today&apos;s reward claimed</span> : <span className="font-bold text-xp">🎁 Reward available</span>}
        </div>
      )}
    </Link>
  );
}

export function VizCard({ v, done }: { v: { id: string; emoji: string; title: string; blurb: string; steps: unknown[] }; done?: string | null }) {
  return (
    <Link href={`/viz/${v.id}`} className="card group block border-accent/50 transition hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="text-5xl transition group-hover:scale-110">{v.emoji}</div>
        <span className="chip text-xs">Interactive</span>
      </div>
      <h3 className="mt-2 font-display text-xl leading-tight">{v.title}</h3>
      <p className="mt-2 text-sm text-muted">{v.blurb}</p>
      <div className="mt-3 text-xs font-bold text-accent">{done ? `📼 ${done}` : `▶ ${v.steps.length} steps · go at your own pace`}</div>
    </Link>
  );
}
