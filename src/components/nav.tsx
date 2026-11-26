"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3, BookOpen, CalendarDays, ClipboardList, Gamepad2, GraduationCap, House, Medal, Megaphone, MessagesSquare, NotebookPen, Settings, ShoppingBag, UserPlus,
  Joystick, Sparkles, Swords, Target, Trophy, Users, Vote, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";

type Item = { href: string; label: string; icon: LucideIcon };

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

export const TUTOR: Item[] = [
  { href: "/tutor", label: "Overview", icon: BarChart3 },
  { href: "/tutor/students", label: "Students", icon: Users },
  { href: "/tutor/content", label: "Content", icon: BookOpen },
  { href: "/tutor/homework", label: "Homework", icon: ClipboardList },
  { href: "/tutor/exams", label: "Exams", icon: GraduationCap },
  { href: "/tutor/attendance", label: "Attendance", icon: CalendarDays },
  { href: "/tutor/polls", label: "Live polls", icon: Vote },
  { href: "/tutor/announcements", label: "Announce", icon: Megaphone },
  { href: "/tutor/challenges", label: "Challenges", icon: Gamepad2 },
  { href: "/tutor/shop", label: "Shop", icon: ShoppingBag },
];

const MOBILE = ["/dashboard", "/courses", "/practice", "/battles", "/profile"];

export type Badges = Partial<Record<string, number>>;

export function Sidebar({ isTutor, badges = {}, special }: { isTutor: boolean; badges?: Badges; special?: boolean }) {
  const path = usePathname();
  const active = (h: string) => path === h || (h !== "/tutor" && path.startsWith(h + "/")) || (h === "/tutor" && path === "/tutor");
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
      {!!badges[i.href] && <span className="ml-auto rounded-full bg-accent px-2 text-xs text-white">{badges[i.href]! > 99 ? "99+" : badges[i.href]}</span>}
    </Link>
  );
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 overflow-y-auto overscroll-contain border-r-2 border-line bg-surface p-3 lg:flex [&>*]:shrink-0">
      <Link href="/dashboard" className="mb-4 px-2 pt-2 font-display text-xl leading-tight text-primary">{BRAND.short}<span className="block text-xs text-muted font-body">Academic Comeback</span></Link>
      <nav aria-label="Main" className="flex flex-col gap-1">{studentItems(special).map(link)}</nav>
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
export function MobileNav({ isTutor, me }: { isTutor: boolean; me: React.ReactNode }) {
  const path = usePathname();
  const tabs: Item[] = [
    STUDENT[0], STUDENT[1], STUDENT[2],
    isTutor ? TUTOR[0] : STUDENT.find((i) => i.href === "/battles")!,
  ];
  const on = (h: string) => path === h || (h !== "/tutor" && path.startsWith(h + "/")) || (h === "/tutor" && path.startsWith("/tutor"));
  const meOn = path === "/profile";
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {tabs.map((i) => (
        <Link key={i.href} href={i.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold", on(i.href) ? "text-primary" : "text-muted")} aria-current={on(i.href) ? "page" : undefined}>
          <i.icon size={24} aria-hidden="true" />
          {i.label}
        </Link>
      ))}
      <Link href="/profile" className={cn("flex flex-col items-center gap-0.5 py-1.5 text-[11px] font-bold", meOn ? "text-primary" : "text-muted")} aria-current={meOn ? "page" : undefined}>
        <span className={cn("rounded-full", meOn && "ring-2 ring-primary ring-offset-1 ring-offset-surface")}>{me}</span>
        Me
      </Link>
    </nav>
  );
}
