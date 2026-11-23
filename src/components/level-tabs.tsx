import Link from "next/link";
import { LEVELS, type LevelId } from "@/lib/levels";
import { cn } from "@/lib/utils";

/** O Level / AS & A Level tabs. Links keep you on the same page with ?level=. */
export function LevelTabs({ current, base, counts, extra = "" }: { current: LevelId; base: string; counts?: Partial<Record<LevelId, number>>; extra?: string }) {
  return (
    <div className="mb-4 mt-4 inline-flex overflow-hidden rounded border-2 border-line" role="tablist" aria-label="Level">
      {LEVELS.map((l, i) => (
        <Link key={l.id} href={`${base}?level=${l.id}${extra}`} role="tab" aria-selected={current === l.id}
          className={cn("px-4 py-2 text-sm font-bold transition", i > 0 && "border-l-2 border-line",
            current === l.id ? "bg-primary text-primary-ink" : "bg-surface2 text-muted hover:text-ink")}>
          {l.label}{counts?.[l.id] !== undefined && <span className="ml-1.5 opacity-70">({counts[l.id]})</span>}
        </Link>
      ))}
    </div>
  );
}

export function LevelEmpty({ level }: { level: LevelId }) {
  return (
    <div className="card py-10 text-center text-muted">
      {level === "A" ? "AS & A Level subjects are coming soon. Ask your tutor if you'd like them added." : "No O Level subjects yet."}
    </div>
  );
}
