import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, ChevronRight, Coins, Flame, Megaphone, NotebookPen, Sparkles, Swords } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getChallenges, getCourseProgress } from "@/lib/data";
import { levelProgress, rankName } from "@/lib/xp";
import { Avatar } from "@/components/avatar";
import { AchievementBadge } from "@/components/badge";
import { Icon } from "@/components/icon";
import { Bar, Card, SectionTitle } from "@/components/ui";
import { fmtDateTime, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

export default async function Dashboard() {
  const me = await requireApproved();
  const sb = await createClient();
  const [challenges, courses, { data: ach }, { data: assignments }, { data: subs }, { data: att }, { data: notes }, { data: ann }] =
    await Promise.all([
      getChallenges(me.id),
      getCourseProgress(me.id),
      sb.from("user_achievements").select("earned_at, achievements(title, icon, rarity)").eq("user_id", me.id).order("earned_at", { ascending: false }).limit(6),
      sb.from("assignments").select("id, title, due_at, kind").order("due_at", { ascending: true, nullsFirst: false }).limit(20),
      sb.from("submissions").select("assignment_id").eq("user_id", me.id),
      sb.from("attendance").select("status").eq("user_id", me.id),
      sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(5),
      sb.from("announcements").select("*").order("created_at", { ascending: false }).limit(2),
    ]);
  const lp = levelProgress(me.xp);
  const submitted = new Set((subs || []).map((s) => s.assignment_id));
  const upcoming = (assignments || []).filter((a) => !submitted.has(a.id)).slice(0, 4);
  const attended = (att || []).filter((a) => a.status === "present" || a.status === "late").length;
  const attPct = att && att.length ? Math.round((attended / att.length) * 100) : null;
  const daily = challenges.filter((c) => c.period === "daily");

  return (
    <div>
      {/* game profile header */}
      <Card className="relative overflow-hidden p-0">
        <div className="h-20 w-full" style={{ background: "linear-gradient(90deg, rgb(var(--primary)), rgb(var(--accent)))" }} />
        <div className="flex flex-col gap-4 p-5 pt-0 sm:flex-row sm:items-end">
          <div className="-mt-10 w-fit">
            <Avatar name={me.display_name} mode={me.avatar_mode} discordUrl={me.discord_avatar_url} robloxUrl={me.roblox_headshot_url} blocky={me.blocky} size={96} ring="rgb(var(--surface))" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl">{me.display_name}</h1>
              <span className="chip text-accent">{me.title || rankName(lp.level)}</span>
              <span className="chip">{me.tier} Level</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="font-display text-xl text-xp" style={{ WebkitTextStroke: "0.5px rgb(0 0 0 / .25)" }}>Lv {lp.level}</span>
              <Bar pct={lp.pct} color="rgb(var(--xp))" className="max-w-sm" />
              <span className="whitespace-nowrap text-sm text-muted">{lp.into} / {lp.needed} XP</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t-2 border-line bg-line sm:grid-cols-4">
          {[
            { icon: Sparkles, label: "Total XP", value: me.xp.toLocaleString(), cls: "text-xp" },
            { icon: Flame, label: "Day streak", value: `${me.streak} (best ${me.best_streak})`, cls: "text-warn" },
            { icon: Coins, label: "Coins", value: me.coins, cls: "text-coin" },
            { icon: CalendarCheck, label: "Attendance", value: attPct === null ? "–" : `${attPct}%`, cls: "text-good" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 bg-surface p-4">
              <s.icon className={s.cls} size={26} aria-hidden="true" />
              <div><div className="font-display text-lg leading-tight">{s.value}</div><div className="text-xs text-muted">{s.label}</div></div>
            </div>
          ))}
        </div>
      </Card>

      {ann && ann.length > 0 && (
        <div className="mt-6 space-y-2">
          {ann.map((a) => (
            <Card key={a.id} className="flex gap-3 border-accent">
              <Megaphone className="mt-0.5 shrink-0 text-accent" size={20} aria-hidden="true" />
              <div><div className="font-display">{a.title}</div><p className="text-sm text-muted">{a.body}</p><div className="mt-1 text-xs text-muted">{timeAgo(a.created_at)}</div></div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <SectionTitle action={<Link href="/challenges" className="text-sm font-bold text-accent">All challenges</Link>}>Today&apos;s quests</SectionTitle>
          <div className="space-y-3">
            {daily.map((c) => (
              <Card key={c.id} className="flex items-center gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center border-2 border-line ${c.completed ? "bg-good text-white" : "bg-surface2"}`} style={{ borderRadius: "calc(var(--radius)*.6)" }}>
                  {c.completed ? "✓" : <Sparkles size={20} aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2"><span className="font-display">{c.title}</span><span className="text-sm font-bold text-xp">+{c.xp_reward} XP</span></div>
                  <div className="mt-1.5 flex items-center gap-2"><Bar pct={(Math.min(c.progress, c.target) / c.target) * 100} /><span className="text-xs text-muted whitespace-nowrap">{Math.min(c.progress, c.target)}/{c.target}</span></div>
                </div>
              </Card>
            ))}
          </div>

          <SectionTitle action={<Link href="/courses" className="text-sm font-bold text-accent">All courses</Link>}>Course progress</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.slug}`} className="card block transition hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center text-white" style={{ background: c.color, borderRadius: "calc(var(--radius)*.6)" }}><Icon name={c.icon} /></div>
                  <div className="min-w-0"><div className="truncate font-display">{c.title}</div><div className="text-xs text-muted">{c.done}/{c.total} chapter quizzes passed</div></div>
                </div>
                <Bar pct={c.pct} color={c.color} className="mt-3" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Up next</SectionTitle>
          <div className="space-y-2">
            {upcoming.length === 0 && <Card className="text-sm text-muted">No homework waiting. Nice.</Card>}
            {upcoming.map((a) => (
              <Link key={a.id} href="/homework" className="card flex items-center gap-3 py-3">
                <NotebookPen className="shrink-0 text-accent" size={20} aria-hidden="true" />
                <div className="min-w-0 flex-1"><div className="truncate font-bold">{a.title}</div><div className="text-xs text-muted">{a.due_at ? `Due ${fmtDateTime(a.due_at)}` : "No due date"}</div></div>
                <ChevronRight size={18} className="text-muted" aria-hidden="true" />
              </Link>
            ))}
            <Link href="/battles" className="card flex items-center gap-3 py-3"><Swords className="text-bad" size={20} aria-hidden="true" /><span className="font-bold">Start a quiz battle</span><ChevronRight size={18} className="ml-auto text-muted" aria-hidden="true" /></Link>
          </div>

          <SectionTitle action={<Link href="/achievements" className="text-sm font-bold text-accent">All</Link>}>Recent achievements</SectionTitle>
          <Card>
            {(!ach || ach.length === 0) && <p className="text-sm text-muted">Pass a quiz to unlock your first badge.</p>}
            <div className="flex flex-wrap gap-3">
              {(ach || []).map((a, i) => {
                const x = a.achievements as unknown as { title: string; icon: string; rarity: string };
                return <AchievementBadge key={i} icon={x.icon} rarity={x.rarity} title={x.title} size={60} />;
              })}
            </div>
          </Card>

          <SectionTitle action={<Link href="/notifications" className="text-sm font-bold text-accent">All</Link>}>Notifications</SectionTitle>
          <Card className="space-y-3">
            {(!notes || notes.length === 0) && <p className="text-sm text-muted">Nothing yet.</p>}
            {(notes || []).map((n) => (
              <div key={n.id} className="text-sm"><div className="font-bold">{n.title}</div>{n.body && <div className="text-muted">{n.body}</div>}<div className="text-xs text-muted">{timeAgo(n.created_at)}</div></div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
