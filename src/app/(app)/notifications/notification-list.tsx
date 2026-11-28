"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { timeAgo, cn } from "@/lib/utils";
import { markRead } from "../actions";

type N = { id: number; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string };

/** Tap a notification to read it in full (bonus reasons, streak news…), with a button to go where it points. */
export function NotificationList({ items }: { items: N[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<N | null>(null);
  const [read, setRead] = useState<Set<number>>(new Set());
  const show = (n: N) => {
    setOpen(n);
    if (!n.read_at && !read.has(n.id)) { setRead((r) => new Set(r).add(n.id)); markRead(n.id).then(() => router.refresh()); }
  };
  const isRead = (n: N) => !!n.read_at || read.has(n.id);

  return (
    <>
      <div className="mt-6 space-y-2">
        {items.length === 0 && <div className="card text-muted">Nothing yet.</div>}
        {items.map((n) => (
          <button key={n.id} onClick={() => show(n)} className={cn("card block w-full py-3 text-left transition hover:-translate-y-0.5", isRead(n) ? "opacity-70" : "border-accent")}>
            <div className="flex items-start gap-2">
              {!isRead(n) && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="unread" />}
              <div className="min-w-0 flex-1">
                <div className="font-bold">{n.title}</div>
                {n.body && <div className="line-clamp-2 text-sm text-muted">{n.body}</div>}
                <div className="text-xs text-muted">{timeAgo(n.created_at)} · tap to read</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-end bg-black/60 p-3 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-labelledby="notif-title">
            <motion.div className="card max-h-[80dvh] w-full max-w-lg overflow-y-auto p-5" initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="text-xs text-muted">{new Date(open.created_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Indian/Mauritius" })}</div>
              <h2 id="notif-title" className="mt-1 font-display text-xl">{open.title}</h2>
              {open.body ? <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">{open.body}</p> : <p className="mt-3 text-muted">No extra message.</p>}
              <div className="mt-5 flex gap-2">
                {open.link && open.link !== "#" && open.link !== "/dashboard" && open.link !== "/notifications" && <Link href={open.link} className="btn btn-primary flex-1">Open</Link>}
                <button className="btn btn-ghost flex-1" onClick={() => setOpen(null)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
