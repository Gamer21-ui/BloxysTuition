import type { Metadata } from "next";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { getCourseProgress } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icon";
import { Bar } from "@/components/ui";
import { LevelEmpty, LevelTabs } from "@/components/level-tabs";
import { inLevel, pickLevel } from "@/lib/levels";


export const metadata: Metadata = { title: "Courses" };

export default async function Courses({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const me = await requireApproved();
  const level = pickLevel((await searchParams).level, me.tier);
  const sb = await createClient();
  const [courses, { data: topics }] = await Promise.all([
    getCourseProgress(me.id),
    sb.from("student_topics").select("label, chapter:chapters(number, title, course:courses(slug, code))").eq("student_id", me.id),
  ]);
  type T = { label: string; chapter: { number: string; title: string; course: { slug: string; code: string } } | null };
  const tp = ((topics as unknown as T[]) || []).filter((t) => t.chapter);
  return (
    <div>
      <h1 className="page-title">Courses</h1>
      <p className="mt-1 text-muted">Pick a subject. Chapters unlock as your tutor releases them.</p>
      {tp.length > 0 && (
        <div className="card mt-5 space-y-2">
          <div className="font-bold">From your tutor</div>
          {(["weak", "strong"] as const).map((l) => tp.some((t) => t.label === l) && (
            <div key={l} className="flex flex-wrap items-center gap-2 text-sm">
              <span className={l === "weak" ? "font-bold text-bad" : "font-bold text-good"}>{l === "weak" ? "🎯 Focus on:" : "💪 Strong at:"}</span>
              {tp.filter((t) => t.label === l).map((t, i) => (
                <Link key={i} href={`/courses/${t.chapter!.course.slug}`} className="chip hover:underline">{t.chapter!.course.code} · {t.chapter!.number} {t.chapter!.title}</Link>
              ))}
            </div>
          ))}
        </div>
      )}
      <LevelTabs current={level} base="/courses" counts={{ O: courses.filter((c) => inLevel(c.tier, "O")).length, A: courses.filter((c) => inLevel(c.tier, "A")).length }} />
      {!courses.some((c) => inLevel(c.tier, level)) && <LevelEmpty level={level} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.filter((c) => inLevel(c.tier, level)).map((c) => (
          <Link key={c.id} href={`/courses/${c.slug}`} className="card block transition hover:-translate-y-1">
            <div className="flex items-start gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center text-white" style={{ background: c.color, borderRadius: "calc(var(--radius)*.7)" }}><Icon name={c.icon} size={28} /></div>
              <div className="min-w-0">
                <h2 className="text-2xl">{c.title}</h2>
                <div className="text-xs font-bold text-muted">{c.exam_label}</div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">{c.description}</p>
            <div className="mt-4 flex items-center gap-3"><Bar pct={c.pct} color={c.color} /><span className="text-sm font-bold">{c.pct}%</span></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
