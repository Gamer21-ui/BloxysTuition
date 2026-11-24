import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, SectionTitle } from "@/components/ui";
import { XpLine, ScoreBars } from "./charts";
import { LEVELS } from "@/lib/levels";

export const metadata: Metadata = { title: "Tutor overview" };
export const dynamic = "force-dynamic";

const muDay = (iso: string) => new Date(new Date(iso).getTime() + 4 * 3600_000).toISOString().slice(0, 10);

export default async function TutorHome({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const pick = (await searchParams).subject || "";
  await requireTutor();
  const admin = createAdminClient();
  const d14 = new Date(Date.now() - 14 * 86400_000).toISOString();
  const d30 = new Date(Date.now() - 30 * 86400_000).toISOString();
  const [{ data: studs }, { data: xp }, { data: att }, { data: atts }, { count: toGrade }] = await Promise.all([
    admin.from("profiles").select("id, display_name, status, last_seen_at").eq("role", "student"),
    admin.from("xp_events").select("user_id, amount, created_at").gte("created_at", d14),
    admin.from("attendance").select("status, session:class_sessions!inner(held_on)").gte("session.held_on", d30.slice(0, 10)),
    admin.from("quiz_attempts").select("user_id, score, total, flagged, finished_at, quiz:quizzes(kind, chapter:chapters(id, number, title), course:courses(slug, code, title, tier, sort))").not("finished_at", "is", null).gte("started_at", d30),
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

  type QA = { user_id: string; score: number; total: number; flagged: boolean; finished_at: string; quiz: { kind: string; chapter: { id: string; number: string; title: string } | null; course: { slug: string; code: string; title: string; tier: string; sort: number } | null } | null };
  const qa = (atts as unknown as QA[]) || [];
  const byCourse: Record<string, { s: number; t: number }> = {};
  type Stu = { tries: number; best: number; last: number; lastAt: string };
  const byChapter: Record<string, { name: string; course: string; slug: string; tier: string; sort: number; s: number; t: number; n: number; students: Record<string, Stu> }> = {};
  for (const a of qa) {
    const c = a.quiz?.course?.title || "Other";
    byCourse[c] ??= { s: 0, t: 0 }; byCourse[c].s += a.score; byCourse[c].t += a.total;
    const ch = a.quiz?.chapter;
    if (ch && a.quiz?.kind === "quiz" && !a.flagged && a.total) {
      const b = (byChapter[ch.id] ??= { name: `${ch.number} ${ch.title}`, course: a.quiz.course?.title || "Other", slug: a.quiz.course?.slug || "", tier: a.quiz.course?.tier || "O", sort: a.quiz.course?.sort ?? 99, s: 0, t: 0, n: 0, students: {} });
      b.s += a.score; b.t += a.total; b.n++;
      const pct = Math.round((100 * a.score) / a.total);
      const st = (b.students[a.user_id] ??= { tries: 0, best: 0, last: pct, lastAt: a.finished_at });
      st.tries++; st.best = Math.max(st.best, pct);
      if (a.finished_at >= st.lastAt) { st.last = pct; st.lastAt = a.finished_at; }
    }
  }
  const courseBars = Object.entries(byCourse).map(([name, v]) => ({ name: name.replace(/ \(.*\)$/, ""), pct: v.t ? Math.round((100 * v.s) / v.t) : 0 }));
  const names = new Map((studs || []).map((x) => [x.id, x.display_name]));
  const weakAll = Object.values(byChapter).map((c) => ({ ...c, pct: Math.round((100 * c.s) / c.t) })).sort((a, b) => a.pct - b.pct);
  // subjects with chapter-quiz activity in the last 30 days, for the filter chips
  const subjects = [...new Map(weakAll.map((c) => [c.slug, { slug: c.slug, title: c.course, sort: c.sort, tries: 0 }])).values()].sort((a, b) => a.sort - b.sort);
  for (const sub of subjects) sub.tries = weakAll.filter((c) => c.slug === sub.slug).reduce((t, c) => t + c.n, 0);
  const picked = subjects.find((x) => x.slug === pick);
  // All: one card per class, 3 weakest chapters per subject. One subject: every chapter with activity.
  const weakByLevel = LEVELS.map((l) => {
    const rows = weakAll.filter((c) => l.tiers.includes(c.tier) && (!picked || c.slug === picked.slug));
    const courses = [...new Set([...rows].sort((a, b) => a.sort - b.sort).map((r) => r.course))];
    return { level: l, courses: courses.map((name) => ({ name, rows: rows.filter((r) => r.course === name).slice(0, picked ? 99 : 3) })) };
  }).filter((g) => !picked || g.courses.length);
  const tone = (p: number) => (p < 50 ? "text-bad" : p < 70 ? "text-warn" : "text-good");
  const ago = (iso: string) => { const d = Math.floor((Date.now() - +new Date(iso)) / 86400_000); return d <= 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`; };
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
      <div id="weak" className="scroll-mt-20" />
      <SectionTitle>Weakest chapters (class average, 30 days)</SectionTitle>
      {subjects.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <Link href="/tutor#weak" className={`btn btn-sm ${!picked ? "btn-primary" : "btn-ghost"}`}>All subjects</Link>
          {subjects.map((x) => (
            <Link key={x.slug} href={`/tutor?subject=${x.slug}#weak`} className={`btn btn-sm ${picked?.slug === x.slug ? "btn-primary" : "btn-ghost"}`}>
              {x.title} <span className="opacity-70">({x.tries})</span>
            </Link>
          ))}
        </div>
      )}
      <p className="mb-3 text-sm text-muted">Tap a chapter to see who did it. Suspiciously fast attempts are left out.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {weakByLevel.map(({ level, courses }) => (
          <Card key={level.id} className="p-0">
            <h3 className="border-b-2 border-line px-4 py-2.5 font-display text-lg">{level.label} class</h3>
            {courses.length ? courses.map((c) => (
              <div key={c.name} className="border-b border-line last:border-0">
                <div className="px-4 pt-2.5 text-xs font-bold uppercase text-muted">{c.name}</div>
                {c.rows.map((w) => {
                  const people = Object.entries(w.students).sort((a, b) => a[1].best - b[1].best);
                  return (
                    <details key={w.name} className="group px-4 py-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <span className="min-w-0"><span className="mr-1 inline-block text-muted transition group-open:rotate-90">›</span>{w.name}</span>
                        <span className={`shrink-0 font-bold ${tone(w.pct)}`}>{w.pct}% <span className="font-normal text-muted">· {people.length} student{people.length === 1 ? "" : "s"} · {w.n} {w.n === 1 ? "try" : "tries"}</span></span>
                      </summary>
                      <div className="mt-2 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead><tr className="text-left text-xs text-muted"><th className="py-1 pr-2">Student</th><th className="pr-2">Tries</th><th className="pr-2">Best</th><th className="pr-2">Latest</th><th>Last done</th></tr></thead>
                          <tbody>
                            {people.map(([id, st]) => (
                              <tr key={id} className="border-t border-line">
                                <td className="py-1.5 pr-2"><Link href={`/tutor/students/${id}`} className="font-bold hover:underline">{names.get(id) || "Student"}</Link></td>
                                <td className="pr-2">{st.tries}</td>
                                <td className={`pr-2 font-bold ${tone(st.best)}`}>{st.best}%</td>
                                <td className={`pr-2 ${tone(st.last)}`}>{st.last}%</td>
                                <td className="whitespace-nowrap text-muted">{ago(st.lastAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  );
                })}
              </div>
            )) : <p className="p-4 text-muted">No chapter quizzes done in the last 30 days.</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
