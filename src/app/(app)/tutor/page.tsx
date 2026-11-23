import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, SectionTitle } from "@/components/ui";
import { XpLine, ScoreBars } from "./charts";

export const metadata: Metadata = { title: "Tutor overview" };
export const dynamic = "force-dynamic";

const muDay = (iso: string) => new Date(new Date(iso).getTime() + 4 * 3600_000).toISOString().slice(0, 10);

export default async function TutorHome() {
  await requireTutor();
  const admin = createAdminClient();
  const d14 = new Date(Date.now() - 14 * 86400_000).toISOString();
  const d30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [{ data: studs }, { data: xp }, { data: att }, { data: atts }, { count: toGrade }] = await Promise.all([
    admin.from("profiles").select("id, display_name, status, last_seen_at").eq("role", "student"),
    admin.from("xp_events").select("user_id, amount, created_at").gte("created_at", d14),
    admin.from("attendance").select("status, session:class_sessions!inner(held_on)").gte("session.held_on", d30.slice(0, 10)),
    admin.from("quiz_attempts").select("user_id, score, total, flagged, quiz:quizzes(kind, chapter:chapters(id, number, title), course:courses(code, title))").not("finished_at", "is", null).gte("started_at", d30),
    admin.from("submissions").select("id", { count: "exact", head: true }).is("graded_at", null),
  ]);

  const approved = (studs || []).filter((s) => s.status === "approved");
  const pending = (studs || []).filter((s) => s.status === "pending");

  // XP + active students per day (Mauritius days)
  const days: { day: string; xp: number; active: number }[] = [];
  for (let i = 13; i >= 0; i--) days.push({ day: muDay(new Date(Date.now() - i * 86400_000).toISOString()), xp: 0, active: 0 });
  const act = new Map<string, Set<string>>();
  for (const e of xp || []) {
    const k = muDay(e.created_at);
    const d = days.find((x) => x.day === k);
    if (d) d.xp += e.amount;
    if (!act.has(k)) act.set(k, new Set());
    act.get(k)!.add(e.user_id);
  }
  for (const d of days) { d.active = act.get(d.day)?.size || 0; d.day = d.day.slice(5); }

  const weekAgo = Date.now() - 7 * 86400_000;
  const thisWeek = new Set((xp || []).filter((e) => +new Date(e.created_at) >= weekAgo).map((e) => e.user_id));
  const lastWeek = new Set((xp || []).filter((e) => +new Date(e.created_at) < weekAgo).map((e) => e.user_id));
  const retained = [...lastWeek].filter((u) => thisWeek.has(u)).length;

  type QA = { score: number; total: number; flagged: boolean; quiz: { kind: string; chapter: { id: string; number: string; title: string } | null; course: { code: string; title: string } | null } | null };
  const qa = (atts as unknown as QA[]) || [];
  const byCourse: Record<string, { s: number; t: number }> = {};
  const byChapter: Record<string, { name: string; s: number; t: number; n: number }> = {};
  for (const a of qa) {
    const c = a.quiz?.course?.title || "Other";
    byCourse[c] ??= { s: 0, t: 0 }; byCourse[c].s += a.score; byCourse[c].t += a.total;
    const ch = a.quiz?.chapter;
    if (ch && a.quiz?.kind === "quiz") {
      byChapter[ch.id] ??= { name: `${a.quiz.course?.code} · ${ch.number} ${ch.title}`, s: 0, t: 0, n: 0 };
      byChapter[ch.id].s += a.score; byChapter[ch.id].t += a.total; byChapter[ch.id].n++;
    }
  }
  const courseBars = Object.entries(byCourse).map(([name, v]) => ({ name: name.replace(/ \(.*\)$/, ""), pct: v.t ? Math.round((100 * v.s) / v.t) : 0 }));
  const weak = Object.values(byChapter).filter((c) => c.n >= 2).map((c) => ({ ...c, pct: Math.round((100 * c.s) / c.t) })).sort((a, b) => a.pct - b.pct).slice(0, 6);
  const a = att || [];
  const attPct = a.length ? Math.round((100 * a.filter((r) => r.status === "present" || r.status === "late").length) / a.length) : null;
  const flagged = qa.filter((x) => x.flagged).length;

  const Stat = ({ label, value, href }: { label: string; value: string | number; href?: string }) => {
    const inner = <Card className="h-full"><div className="text-sm text-muted">{label}</div><div className="font-display text-3xl">{value}</div></Card>;
    return href ? <Link href={href}>{inner}</Link> : inner;
  };

  return (
    <div>
      <h1 className="page-title">Tutor HQ</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Students" value={approved.length} href="/tutor/students" />
        <Stat label="Waiting for approval" value={pending.length} href="/tutor/students" />
        <Stat label="To mark" value={toGrade || 0} href="/tutor/homework" />
        <Stat label="Active this week" value={`${thisWeek.size}/${approved.length}`} />
        <Stat label="Came back from last week" value={lastWeek.size ? `${Math.round((100 * retained) / lastWeek.size)}%` : "–"} />
        <Stat label="Attendance (30 days)" value={attPct === null ? "–" : `${attPct}%`} href="/tutor/attendance" />
        <Stat label="Quizzes done (30 days)" value={qa.length} />
        <Stat label="Suspiciously fast quizzes" value={flagged} />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card><h2 className="mb-2 text-lg">Engagement, last 14 days</h2><XpLine data={days} /></Card>
        <Card><h2 className="mb-2 text-lg">Average quiz score by subject (30 days)</h2>{courseBars.length ? <ScoreBars data={courseBars} /> : <p className="text-muted">No quizzes yet.</p>}</Card>
      </div>
      <SectionTitle>Weakest chapters (class average)</SectionTitle>
      <Card className="divide-y divide-line p-0">
        {weak.length ? weak.map((w) => (
          <div key={w.name} className="flex items-center justify-between px-4 py-2.5">
            <span>{w.name}</span>
            <span className={w.pct < 50 ? "font-bold text-bad" : w.pct < 70 ? "font-bold text-warn" : "font-bold text-good"}>{w.pct}% · {w.n} tries</span>
          </div>
        )) : <p className="p-4 text-muted">Needs at least 2 attempts on a chapter quiz.</p>}
      </Card>
    </div>
  );
}
