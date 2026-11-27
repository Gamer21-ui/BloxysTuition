import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock, PlayCircle, Video } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { renderMarkdown } from "@/lib/markdown";
import { ResourceList } from "@/components/resource-list";
import { Card, SectionTitle } from "@/components/ui";
import { isLive } from "@/lib/utils";
import { vizForChapter } from "@/lib/viz";
import { gamesFor } from "@/lib/arcade";
import { GameCard, VizCard } from "@/components/game-card";
import { GoLiveButton } from "@/components/viz/go-live";

export const metadata: Metadata = { title: "Chapter" };

export default async function ChapterPage({ params }: { params: Promise<{ slug: string; chapter: string }> }) {
  const me = await requireApproved();
  const { slug, chapter } = await params;
  const sb = await createClient();
  const { data: course } = await sb.from("courses").select("*").eq("slug", slug).single();
  if (!course) notFound();
  const { data: ch } = await sb.from("chapters").select("*").eq("course_id", course.id).eq("number", chapter).single();
  if (!ch) notFound();
  if (!isLive(ch.status, ch.release_at) && me.role !== "tutor") {
    return <Card className="text-center"><Lock className="mx-auto text-warn" /><p className="mt-2">This chapter is locked.</p><Link href={`/courses/${slug}`} className="btn btn-ghost mt-4">Back</Link></Card>;
  }
  const [{ data: parts }, { data: resources }, { data: quizzes }, { data: attempts }] = await Promise.all([
    sb.from("parts").select("*").eq("chapter_id", ch.id).order("sort"),
    sb.from("resources").select("*").eq("chapter_id", ch.id).order("created_at", { ascending: false }),
    sb.from("quizzes").select("*").eq("chapter_id", ch.id).order("sort"),
    sb.from("quiz_attempts").select("quiz_id, score, total, flagged").eq("user_id", me.id).not("finished_at", "is", null),
  ]);
  const lib = (resources || []).filter((r) => r.section === "library");
  const vizzes = vizForChapter(slug, String(ch.number));
  const games = gamesFor(slug, String(ch.number));
  const cls = (resources || []).filter((r) => r.section === "class");

  return (
    <div>
      <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1 text-sm font-bold text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" /> {course.title}</Link>
      <h1 className="page-title mt-2">Chapter {ch.number}: {ch.title}</h1>

      {(vizzes.length > 0 || games.length > 0) && (
        <section className="mt-4">
          <SectionTitle>Interactive &amp; games</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vizzes.map((v) => (
              <div key={v.id} className="space-y-2">
                <VizCard v={v} />
                {me.role === "tutor" && <GoLiveButton viz={v.id} />}
              </div>
            ))}
            {games.map((g) => <GameCard key={g.slug} g={g} />)}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-3">
          {(parts || []).map((p) => (
            <details key={p.id} className="card" open={(parts || []).length === 1}>
              <summary className="flex cursor-pointer items-center gap-3">
                <span className="chip">{p.number}</span>
                <span className="font-display text-lg">{p.title}</span>
              </summary>
              <div className="mt-3">
                {p.body ? (
                  <div className="prose-notes" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.body) }} />
                ) : (
                  <p className="text-sm text-muted">Notes for this part are coming soon. Check the files on the right.</p>
                )}
                {p.video_url && (
                  <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm mt-3"><Video size={16} aria-hidden="true" /> Watch the video</a>
                )}
              </div>
            </details>
          ))}
        </div>
        <div>
          {(quizzes || []).map((q) => {
            const live = isLive(q.status, q.release_at);
            const tries = (attempts || []).filter((a) => a.quiz_id === q.id && !a.flagged && a.total);
            const best = tries.length ? Math.max(...tries.map((a) => a.score / a.total)) : null;
            return (
              <Card key={q.id} className="mb-4">
                <div className="font-display text-xl">{q.title}</div>
                <div className="text-sm text-muted">Up to {q.xp_reward} XP{best !== null && ` · best ${Math.round(best * 100)}%`}</div>
                {live ? (
                  <Link href={`/quiz/${q.id}`} className="btn btn-primary mt-3 w-full"><PlayCircle size={18} aria-hidden="true" /> {best === null ? "Start quiz" : "Try again"}</Link>
                ) : (
                  <div className="btn btn-ghost mt-3 w-full"><Lock size={16} aria-hidden="true" /> Locked</div>
                )}
              </Card>
            );
          })}
          <SectionTitle>Class notes</SectionTitle>
          <Card><ResourceList items={cls} empty="Your tutor's notes for this chapter will appear here." /></Card>
          <SectionTitle>Library</SectionTitle>
          <Card><ResourceList items={lib} empty="No library files yet." /></Card>
        </div>
      </div>
    </div>
  );
}
