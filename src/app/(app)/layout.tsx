import type { Metadata } from "next";
import Link from "next/link";
import { Coins, Flame } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MobileNav, Sidebar, type Badges } from "@/components/nav";
import { MobileMenu } from "@/components/mobile-menu";
import { PartyBanner } from "@/components/party-banner";
import { NotificationBell } from "@/components/notification-bell";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { BRAND } from "@/lib/brand";
import { levelProgress, rankName } from "@/lib/xp";
import { redirect } from "next/navigation";
import { takes } from "@/lib/subjects";
import { Tutorial } from "@/components/tutorial";
import { LivePoll } from "@/components/live-poll";
import { PrestigeBadge } from "@/components/prestige-badge";
import { emblem } from "@/lib/prestige";
import { Heartbeat } from "@/components/heartbeat";
import { LiveBanner } from "@/components/live-banner";
import type { NavStyle } from "@/components/nav";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireApproved();
  // new students pick their subjects before anything else.
  // (undefined = the database update hasn't been run yet, so don't send anyone to the picker)
  if (me.role === "student" && me.subjects !== undefined && !me.subjects?.length) redirect("/subjects");
  const sb = await createClient();
  const tutor = me.role === "tutor";
  const now = new Date().toISOString();
  const [{ data: site }, { count }, { data: asg }, { data: subs }, { count: due }, pending, toMark, { count: frReq }, { count: partyInv }] = await Promise.all([
    sb.from("site_settings").select("tutorial_version").maybeSingle(),
    sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
    sb.from("assignments").select("id, course:courses(slug)"),
    sb.from("submissions").select("assignment_id").eq("user_id", me.id),
    sb.from("review_items").select("question_id", { count: "exact", head: true }).eq("user_id", me.id).lte("due_at", now),
    tutor ? sb.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending") : Promise.resolve({ count: 0 }),
    tutor ? sb.from("submissions").select("id", { count: "exact", head: true }).is("graded_at", null) : Promise.resolve({ count: 0 }),
    sb.from("friendships").select("requester", { count: "exact", head: true }).eq("addressee", me.id).eq("status", "pending"),
    sb.from("party_invites").select("party_id", { count: "exact", head: true }).eq("to_id", me.id),
  ]);
  // menu style (new hubs by default; the tutor can switch everyone back to the classic menu)
  const { data: nav } = await sb.from("site_settings").select("nav_style").maybeSingle();
  const style: NavStyle = nav?.nav_style === "classic" ? "classic" : "new";
  // skipped homework (black market) doesn't count as to-do; table may not exist before the update
  const { data: skipped } = await sb.from("assignment_overrides").select("assignment_id").eq("user_id", me.id).eq("exempt", true);
  const skippedIds = new Set((skipped || []).map((x) => x.assignment_id));
  const handedIn = new Set((subs || []).map((s) => s.assignment_id));
  const badges: Badges = {
    "/homework": tutor ? 0 : ((asg || []) as unknown as { id: string; course: { slug: string } | null }[]).filter((a) => !handedIn.has(a.id) && !skippedIds.has(a.id) && (!a.course || takes(me, a.course.slug))).length,
    "/practice": due || 0,
    "/friends": (frReq || 0) + (partyInv || 0),
    "/tutor/students": pending.count || 0,
    "/tutor/homework": toMark.count || 0,
  };
  const lp = levelProgress(me.xp);
  const avatar = (size: number) => (
    <Avatar name={me.display_name} mode={me.avatar_mode} discordUrl={me.discord_avatar_url} robloxUrl={me.roblox_headshot_url} blocky={me.blocky} size={size} frame={me.frame} />
  );

  return (
    <div className="flex min-h-dvh">
      <Sidebar isTutor={tutor} badges={badges} special={tutor || !!me.special} style={style} />
      <div className="min-w-0 flex-1 pb-24 lg:pb-8">
        <header className="sticky top-0 z-30 border-b-2 border-line bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <MobileMenu
              isTutor={tutor} special={tutor || !!me.special} style={style} badges={badges} avatar={avatar(60)} name={<NameTag name={me.display_name} style={me.name_style} />}
              handle={me.discord_username} level={lp.level} rank={(me.prestige ? `${emblem(me.prestige).label} · ` : "") + rankName(lp.level)} xpInto={lp.into} xpNeeded={lp.needed} xpPct={lp.pct}
              coins={me.coins} streak={me.streak} freezes={me.streak_freezes ?? 0}
            />
            <Link href="/dashboard" className="font-display text-xl text-primary lg:hidden">{BRAND.short}</Link>
            <Link href="/profile" className="hidden min-w-0 items-center gap-2 lg:flex" aria-label="Your profile">
              {avatar(38)}
              <div className="min-w-0">
                <div className="truncate font-display leading-tight"><NameTag name={me.display_name} style={me.name_style} /></div>
                <div className="flex items-center gap-1 text-xs text-muted"><PrestigeBadge n={me.prestige} /> Lv {lp.level}</div>
              </div>
            </Link>
            <div className="ml-1 hidden w-40 lg:block" title={`${lp.into} / ${lp.needed} XP to next level`}>
              <div className="bar h-2.5"><i style={{ width: `${lp.pct}%`, background: "rgb(var(--xp))" }} /></div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="chip text-warn" title="Day streak"><Flame size={14} aria-hidden="true" /> {me.streak}</span>
              <Link href="/shop" className="chip text-coin hover:underline" title="Coins: spend them in the shop"><Coins size={14} aria-hidden="true" /> {me.coins}</Link>
              <NotificationBell userId={me.id} initial={count ?? 0} />
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </div>
      <MobileNav isTutor={tutor} me={avatar(28)} style={style} />
      <LiveBanner me={{ role: me.role, tier: me.tier, subjects: me.subjects }} />
      <PartyBanner meId={me.id} />
      <Heartbeat />
      {!tutor && <LivePoll meId={me.id} />}
      {/* site tour: new students, or everyone after the tutor relaunches it (skipped until the database update is in) */}
      {site && me.tutorial_version !== undefined && (
        <Tutorial show={!tutor && me.tutorial_version < site.tutorial_version} isStudent={!tutor} seen={me.tutorial_version} />
      )}
    </div>
  );
}
