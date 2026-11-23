"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Coins, Flame, LogOut, Menu, ShoppingBag, Snowflake, X } from "lucide-react";
import { STUDENT, TUTOR, type Badges } from "@/components/nav";
import { cn } from "@/lib/utils";

type Props = {
  isTutor: boolean; badges: Badges; avatar: React.ReactNode; name: React.ReactNode; handle: string | null;
  level: number; rank: string; xpInto: number; xpNeeded: number; xpPct: number; coins: number; streak: number; freezes: number;
};

/** ☰ button + slide-out menu with every section, for phones and tablets (like the Roblox app). */
export function MobileMenu(p: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const path = usePathname();
  const anyBadge = Object.values(p.badges).some((n) => (n || 0) > 0);

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  const row = (i: (typeof STUDENT)[number]) => {
    const active = path === i.href || (i.href !== "/tutor" && path.startsWith(i.href + "/"));
    const n = p.badges[i.href] || 0;
    return (
      <Link key={i.href} href={i.href} className={cn("flex items-center gap-4 px-2 py-3 text-lg font-bold", active ? "text-primary" : "text-ink")} aria-current={active ? "page" : undefined}>
        <i.icon size={24} aria-hidden="true" className={active ? "" : "text-muted"} />
        <span className="flex-1">{i.label}</span>
        {n > 0 && <span className="rounded-full bg-accent px-2.5 py-0.5 text-sm text-white">{n > 99 ? "99+" : n}</span>}
      </Link>
    );
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative -ml-1 p-1.5 lg:hidden" aria-label="Open menu" aria-expanded={open}>
        <Menu size={26} aria-hidden="true" />
        {anyBadge && <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-surface" />}
      </button>
      {mounted && createPortal(
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <motion.div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col overflow-y-auto [&>*]:shrink-0 bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.22 }}
            >
              <div className="flex items-start gap-3">
                <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-3">
                  {p.avatar}
                  <div className="min-w-0">
                    <div className="truncate font-display text-xl">{p.name}</div>
                    {p.handle && <div className="truncate text-sm text-muted">@{p.handle}</div>}
                    <div className="text-xs font-bold text-muted">Lv {p.level} · {p.rank}</div>
                  </div>
                </Link>
                <button onClick={() => setOpen(false)} className="p-1 text-muted" aria-label="Close menu"><X size={24} aria-hidden="true" /></button>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border-2 border-line">
                <div className="flex items-center gap-3 p-3">
                  <Coins size={24} className="text-coin" aria-hidden="true" />
                  <span className="font-display text-2xl">{p.coins.toLocaleString()}</span>
                  <Link href="/shop" className="btn btn-ghost btn-sm ml-auto"><ShoppingBag size={16} aria-hidden="true" /> Shop</Link>
                </div>
                <div className="border-t-2 border-line p-3">
                  <div className="mb-1 flex justify-between text-xs font-bold text-muted"><span>Level {p.level}</span><span>{p.xpInto} / {p.xpNeeded} XP</span></div>
                  <div className="bar h-2.5"><i style={{ width: `${p.xpPct}%`, background: "rgb(var(--xp))" }} /></div>
                  <div className="mt-2 flex gap-4 text-sm font-bold">
                    <span className="flex items-center gap-1 text-warn"><Flame size={16} aria-hidden="true" /> {p.streak}-day streak</span>
                    {p.freezes > 0 && <span className="flex items-center gap-1 text-accent"><Snowflake size={16} aria-hidden="true" /> {p.freezes}</span>}
                  </div>
                </div>
              </div>

              <nav aria-label="All sections" className="mt-3 divide-y-0">{STUDENT.filter((i) => i.href !== "/profile").map(row)}</nav>
              {p.isTutor && (
                <>
                  <div className="mt-3 border-t-2 border-line px-2 pt-3 text-xs font-bold uppercase tracking-wider text-muted">Tutor</div>
                  <nav aria-label="Tutor sections">{TUTOR.map(row)}</nav>
                </>
              )}
              <div className="mt-3 border-t-2 border-line pt-2">
                {row(STUDENT.find((i) => i.href === "/profile")!)}
                <form action="/auth/signout" method="post">
                  <button className="flex w-full items-center gap-4 px-2 py-3 text-lg font-bold text-muted"><LogOut size={24} aria-hidden="true" /> Sign out <ChevronRight className="ml-auto opacity-0" /></button>
                </form>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>,
      // rendered on <body>: the sticky header's blur would otherwise trap this fixed panel inside it
      document.body)}
    </>
  );
}
