"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { sfx } from "@/lib/battle-audio";
import { vizById } from "@/lib/viz";
import { takes } from "@/lib/subjects";

/** Pops up for everyone when the tutor starts a live lesson (and disappears when it ends). */
export function LiveBanner({ me }: { me: { role: string; tier: string; subjects?: string[] | null } }) {
  const sb = useMemo(() => createClient(), []);
  const path = usePathname();
  const [live, setLive] = useState<{ id: string; viz: string } | null>(null);
  useEffect(() => {
    sb.from("live_sessions").select("id, viz").eq("status", "live").order("started_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setLive(data || null));
    const ch = sb.channel("live-banner")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions" }, ({ new: row }) => {
        const r = row as { id: string; viz: string; status: string };
        if (r.status === "live") { setLive((cur) => { if (cur?.id !== r.id) sfx("join"); return { id: r.id, viz: r.viz }; }); }
        else setLive((cur) => (cur?.id === r.id ? null : cur));
      })
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb]);
  const found = live ? vizById(live.viz) : null;
  // only students who take that course (and are at that level) get the banner
  const forMe = found && (me.role === "tutor" || (takes(me, found.course) && (found.course.startsWith("o-") ? me.tier === "O" : me.tier !== "O")));
  const viz = forMe ? found : null;
  return (
    <AnimatePresence>
      {live && viz && path !== "/live" && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
          className="fixed inset-x-3 bottom-24 z-40 mx-auto max-w-md lg:bottom-6">
          <Link href="/live" className="flex items-center gap-3 rounded-2xl border-2 border-red-500 bg-surface p-3 shadow-2xl">
            <span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" /><span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" /></span>
            <span className="min-w-0 flex-1"><span className="block text-xs font-black uppercase tracking-wider text-red-500">Live lesson now</span><span className="block truncate font-bold">{viz.emoji} {viz.title}</span></span>
            <span className="btn btn-primary btn-sm">Join</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
