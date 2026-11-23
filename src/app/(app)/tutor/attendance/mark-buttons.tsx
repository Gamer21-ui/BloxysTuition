"use client";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { mark } from "../actions";

const OPTS = [
  { s: "present", l: "✔ Present", c: "bg-good text-white" },
  { s: "late", l: "⏰ Late", c: "bg-warn text-white" },
  { s: "absent", l: "✖ Absent", c: "bg-bad text-white" },
  { s: "excused", l: "Excused", c: "bg-surface2" },
] as const;

export function MarkButtons({ session, user, current }: { session: string; user: string; current: string | null }) {
  const [cur, setCur] = useState(current);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-1">
      {OPTS.map((o) => (
        <button key={o.s} disabled={pending} onClick={() => { setCur(o.s); start(() => mark(session, user, o.s)); }}
          className={cn("chip text-xs", cur === o.s ? o.c : "opacity-60 hover:opacity-100")}>{o.l}</button>
      ))}
    </div>
  );
}
