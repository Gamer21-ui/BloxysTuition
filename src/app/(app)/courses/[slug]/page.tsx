import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Lock, Timer } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/icon";
import { ResourceList } from "@/components/resource-list";
import { Card, SectionTitle } from "@/components/ui";
import { fmtDateTime, isLive } from "@/lib/utils";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug.replace("o-", "O Level ").replace(/-/g, " ") };
}

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireApproved();
  const { slug } = await params;
  const { tab = "chapters" } = await searchParams;
  const sb = await createClient();
  const { data: course } = await sb.from("courses").select("*").eq("slug", slug).single();
  if (!course) notFound();
  const [{ data: chapters }, { data: quizzes }, { data: attempts }, { data: resources }] = await Promise.all([
    sb.from("chapters").select("*, parts(count)").eq("course_id", course.id).order("sort"),
    sb.from("quizzes").select("*").eq("course_id", course.id),
    sb.from("quiz_attempts").select("quiz_id, score, total, flagged").eq("user_id", me.id).not("finished_at", "is", null),
    sb.from("resources").select("*").eq("course_id", course.id).is("chapter_id", null).order("created_at", { ascending: false }),
  ]);
  const best = new Map<string, number>();
  (attempts || []).forEach((a) => { if (!a.flagged && a.total) best.set(a.quiz_id, Math.max(best.get(a.quiz_id) || 0, a.score / a.total)); });
  const speedrun = (quizzes || []).find((q) => q.kind === "speedrun" && isLive(q.status, q.release_at));
  const tabs = [["chapters", "Chapters"], ["library", "Library"], ["class", "Class notes"]];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="grid h-16 w-16 place-items-center text-white" style={{ background: course.color, borderRadius: "calc(var(--radius)*.7)" }}><Icon name={course.icon} size={32} /></div>
        <div className="min-w-0 flex-1">
          <h1 className="page-title">{course.title}</h1>
          <div className="text-sm font-bold text-muted">{course.exam_label}</div>
        </div>
        {speedrun && <Link href={`/quiz/${speedrun.id}`} className="btn btn-accent"><Timer size={18} aria-hidden="true" /> Speedrun</Link>}
      </div>

      <div className="mt-6 flex gap-2" role="tablist">
        {tabs.map(([k, l]) => (
          <Link key={k} href={`/courses/${slug}?tab=${k}`} role="tab" aria-selected={tab === k} className={`btn btn-sm ${tab === k ? "btn-primary" : "btn-ghost"}`}>{l}</Link>
        ))}
      </div>

      {tab === "chapters" && (
        <div className="mt-5 space-y-3">
          {(chapters || []).map((ch) => {
            const live = isLive(ch.status, ch.release_at);
            const qz = (quizzes || []).find((q) => q.chapter_id === ch.id && q.kind === "quiz");
            const b = qz ? best.get(qz.id) : undefined;
            const parts = (ch.parts as unknown as { count: number }[])?.[0]?.count ?? 0;
            const inner = (
              <div className="flex items-center gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center font-display text-xl ${live ? "text-white" : "bg-surface2 text-muted"}`} style={{ background: live ? course.color : undefined, borderRadius: "calc(var(--radius)*.6)" }}>
                  {live ? ch.number : <Lock size={20} aria-label="Locked" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg">{ch.title}</div>
                  <div className="text-xs text-muted">
                    {live ? `${parts} part${parts === 1 ? "" : "s"}` : ch.status === "scheduled" && ch.release_at ? `Unlocks ${fmtDateTime(ch.release_at)}` : "Locked by your tutor"}
                  </div>
                </div>
                {b !== undefined && (
                  <span className={`chip ${b >= 0.5 ? "text-good" : "text-warn"}`}>{b >= 0.5 && <CheckCircle2 size={14} aria-hidden="true" />} {Math.round(b * 100)}%</span>
                )}
              </div>
            );
            return live ? (
              <Link key={ch.id} href={`/courses/${slug}/${ch.number}`} className="card block transition hover:-translate-y-0.5">{inner}</Link>
            ) : (
              <div key={ch.id} className="card opacity-70" aria-disabled="true">{inner}</div>
            );
          })}
        </div>
      )}

      {tab !== "chapters" && (
        <>
          <SectionTitle>{tab === "library" ? "Library" : "Class notes"}</SectionTitle>
          <p className="-mt-2 mb-3 text-sm text-muted">
            {tab === "library" ? "Ready-made notes and resources for the whole course." : "Notes your tutor uploads after each lecture."} Chapter-specific files are inside each chapter.
          </p>
          <Card><ResourceList items={(resources || []).filter((r) => r.section === tab)} empty="Nothing here yet." /></Card>
        </>
      )}
    </div>
  );
}
