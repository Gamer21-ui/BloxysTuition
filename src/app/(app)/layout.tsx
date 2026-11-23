import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Flame } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MobileNav, Sidebar } from "@/components/nav";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar } from "@/components/avatar";
import { levelProgress } from "@/lib/xp";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireApproved();
  const sb = await createClient();
  const { count } = await sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null);
  const lp = levelProgress(me.xp);
  return (
    <div className="flex min-h-dvh">
      <Sidebar isTutor={me.role === "tutor"} />
      <div className="min-w-0 flex-1 pb-24 lg:pb-8">
        <header className="sticky top-0 z-30 border-b-2 border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <Link href="/profile" className="flex min-w-0 items-center gap-2" aria-label="Your profile">
              <Avatar name={me.display_name} mode={me.avatar_mode} discordUrl={me.discord_avatar_url} robloxUrl={me.roblox_headshot_url} blocky={me.blocky} size={38} />
              <div className="hidden min-w-0 sm:block">
                <div className="truncate font-display leading-tight">{me.display_name}</div>
                <div className="text-xs text-muted">Lv {lp.level}</div>
              </div>
            </Link>
            <div className="ml-1 hidden w-40 md:block" title={`${lp.into} / ${lp.needed} XP to next level`}>
              <div className="bar h-2.5"><i style={{ width: `${lp.pct}%`, background: "rgb(var(--xp))" }} /></div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="chip text-warn" title="Day streak"><Flame size={14} aria-hidden="true" /> {me.streak}</span>
              <span className="chip text-coin" title="Coins"><Coins size={14} aria-hidden="true" /> {me.coins}</span>
              <span className="chip md:hidden" title="Level">Lv {lp.level}</span>
              <NotificationBell userId={me.id} initial={count ?? 0} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
      <MobileNav isTutor={me.role === "tutor"} />
    </div>
  );
}
