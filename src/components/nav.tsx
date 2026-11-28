"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, BookOpen, CalendarDays, ClipboardList, Gamepad2, GraduationCap, House, Medal, Megaphone, MessagesSquare, NotebookPen, Settings, ShoppingBag, UserPlus,
  Joystick, Radio, Sparkles, Swords, Target, Trophy, UserRound, Users, Vote, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type Item = { href: string; label: string; icon: LucideIcon; also?: string[] };
export type NavStyle = "new" | "classic";

export const STUDENT: Item[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/practice", label: "Exam prep", icon: GraduationCap },
  { href: "/challenges", label: "Quests", icon: Target },
  { href: "/battles", label: "Battles", icon: Swords },
  { href: "/arcade", label: "Arcade", icon: Joystick },
  { href: "/friends", label: "Friends", icon: UserPlus },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/homework", label: "Homework", icon: NotebookPen },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Medal },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/profile", label: "Profile", icon: Settings },
];

/** 🌟 Special Training: only for students the tutor marks as special (and the tutor). */
export const SPECIAL: Item = { href: "/special", label: "Special Training", icon: Sparkles };
export const studentItems = (special?: boolean) => (special ? STUDENT.flatMap((i) => (i.href === "/arcade" ? [i, SPECIAL] : [i])) : STUDENT);

/** New (default) menu: five hubs. Each hub "owns" the pages listed in `also`, so it lights up there too. */
export const HUBS: Item[] = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/courses", label: "Courses", icon: BookOpen, also: ["/practice", "/quiz", "/viz", "/live"] },
  { href: "/homework", label: "Homework", icon: NotebookPen },
  { href: "/play", label: "Play", icon: Gamepad2, also: ["/battles", "/arcade", "/challenges", "/shop", "/black-market"] },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/chat", label: "Chat", icon: MessagesSquare },
  { href: "/me", label: "Me", icon: UserRound, also: ["/profile", "/friends", "/notifications", "/achievements", "/reports"] },
];
export const hubItems = (special?: boolean) => (special ? HUBS.flatMap((i) => (i.href === "/homework" ? [i, SPECIAL] : [i])) : HUBS);
export const menuItems = (style: NavStyle, special?: boolean) => (style === "classic" ? studentItems(special) : hubItems(special));
/** a hub's badge = sum of the badges of the pages it owns */
export const badgeOf = (i: Item, badges: Badges) => [i.href, ...(i.also || [])].reduce((n, h) => n + (badges[h] || 0), 0);
export const isActive = (i: Item, path: string) => {
  const hit = (h: string) => path === h || (h !== "/tutor" && path.startsWith(h + "/"));
  return i.href === "/tutor" ? path === "/tutor" : hit(i.href) || (i.also || []).some(hit);
};

export const TUTOR: Item[] = [
  { href: "/tutor", label: "Overview", icon: BarChart3 },
  { href: "/tutor/students", label: "Students", icon: Users },
  { href: "/tutor/content", label: "Content", icon: BookOpen },
  { href: "/tutor/homework", label: "Homework", icon: ClipboardList },
  { href: "/tutor/exams", label: "Exams", icon: GraduationCap },
  { href: "/tutor/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/tutor/live", label: "Live lessons", icon: Radio },
  { href: "/tutor/polls", label: "Live polls", icon: Vote },
  { href: "/tutor/announcements", label: "Announce", icon: Megaphone },
  { href: "/tutor/challenges", label: "Challenges", icon: Gamepad2 },
  { href: "/tutor/shop", label: "Shop", icon: ShoppingBag },
];

const MOBILE = ["/dashboard", "/courses", "/practice", "/battles", "/profile"];

export type Badges = Partial<Record<string, number>>;

export function Sidebar({ isTutor, badges = {}, special, style = "new" }: { isTutor: boolean; badges?: Badges; special?: boolean; style?: NavStyle }) {
  const path = usePathname();
  const all = [...menuItems(style, special), ...TUTOR];
  const active = (h: string) => { const it = all.find((x) => x.href === h); return it ? isActive(it, path) : path === h; };
  const link = (i: Item) => (
    <Link
      key={i.href}
      href={i.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 font-bold transition",
        active(i.href) ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface2 hover:text-ink",
      )}
      style={{ borderRadius: "calc(var(--radius) * 0.7)" }}
      aria-current={active(i.href) ? "page" : undefined}
    >
      <i.icon size={20} aria-hidden="true" /> {i.label}
      {badgeOf(i, badges) > 0 && <span className="ml-auto rounded-full bg-accent px-2 text-xs text-white">{badgeOf(i, badges) > 99 ? "99+" : badgeOf(i, badges)}</span>}
    </Link>
  );
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain border-r-2 border-line bg-surface p-3 lg:flex [&>*]:shrink-0">
      <Link href="/dashboard" className="mb-4 px-2 pt-2 font-display text-xl leading-tight text-primary">{BRAND.short}<span className="block text-xs text-muted font-body">Academic Comeback</span></Link>
      <nav aria-label="Main" className="flex flex-col gap-1">{menuItems(style, special).map(link)}</nav>
      {isTutor && (
        <>
          <div className="mt-5 px-3 text-xs font-bold uppercase tracking-wider text-muted">Tutor</div>
          <nav aria-label="Tutor" className="flex flex-col gap-1">{TUTOR.map(link)}</nav>
        </>
      )}
    </aside>
  );
}

/** Bottom tab bar on phones (like Roblox): four sections plus "Me" with your avatar. Everything else is in the ☰ menu. */
export function MobileNav({ isTutor, me, style = "new" }: { isTutor: boolean; me: React.ReactNode; style?: NavStyle }) {
  const path = usePathname();
  const tabs: Item[] = style === "classic"
    ? [STUDENT[0], STUDENT[1], STUDENT[2], isTutor ? TUTOR[0] : STUDENT.find((i) => i.href === "/battles")!]
    : ["/dashboard", "/courses", "/play"].map((h) => HUBS.find((i) => i.href === h)!).concat(isTutor ? TUTOR[0] : HUBS.find((i) => i.href === "/homework")!);
  const on = (h: string) => { const it = [...HUBS, ...STUDENT, ...TUTOR].find((x) => x.href === h)!; return h === "/tutor" ? path.startsWith("/tutor") : isActive(it, path); };
  const meHref = style === "classic" ? "/profile" : "/me";
const meOn = path === "/profile";
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {tabs.map((i) => (
        <Link key={i.href} href={i.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold", on(i.href) ? "text-primary" : "text-muted")} aria-current={on(i.href) ? "page" : undefined}>
          <i.icon size={24} aria-hidden="true" />
          {i.label}
        </Link>
      ))}
      <Link href={meHref} className={cn("flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold", meOn ? "text-primary" : "text-muted")} aria-current={meOn ? "page" : undefined}>
        <span className={cn("rounded-full", meOn && "ring-2 ring-primary ring-offset-1 ring-offset-surface")}>{me}</span>
        Me
      </Link>
    </nav>
  );
}
