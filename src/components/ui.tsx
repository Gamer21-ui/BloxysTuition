import { cn } from "@/lib/utils";

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...rest}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-end justify-between gap-3">
      <h2 className="text-2xl">{children}</h2>
      {action}
    </div>
  );
}

export function Bar({ pct, color = "rgb(var(--primary))", className }: { pct: number; color?: string; className?: string }) {
  return (
    <div className={cn("bar", className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: color }} />
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card text-center text-muted py-10">{children}</div>;
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "text-good",
    scheduled: "text-accent",
    locked: "text-warn",
    draft: "text-muted",
    pending: "text-warn",
    approved: "text-good",
    suspended: "text-bad",
  };
  return <span className={cn("chip", map[status])}>{status}</span>;
}
