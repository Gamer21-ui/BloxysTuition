import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { QuizPlayer } from "./quiz-player";
import { ExamPlayer } from "./exam-player";

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  await requireApproved();
  const { id } = await params;
  const sb = await createClient();
  const { data: quiz } = await sb.from("quizzes").select("*, courses(title, slug, tier, color), chapters(number, title)").eq("id", id).single();
  if (!quiz) notFound();
  const course = quiz.courses as unknown as { title: string; slug: string; tier: string; color: string };
  const ch = quiz.chapters as unknown as { number: string; title: string } | null;
  if (quiz.kind === "exam") {
    return (
      <ExamPlayer quizId={quiz.id} title={quiz.title} subtitle={course.title} count={quiz.question_count || 40}
        timeLimit={quiz.time_limit_sec || 3600} xpReward={quiz.xp_reward} color={course.color}
        real={course.slug === "o-accounting" || course.slug === "o-economics"} />
    );
  }
  return (
    <QuizPlayer
      quizId={quiz.id}
      title={quiz.title}
      subtitle={ch ? `${course.title} · Chapter ${ch.number}: ${ch.title}` : quiz.kind === "review" ? `${course.title} · your mistakes deck` : course.title}
      kind={quiz.kind}
      xpReward={quiz.xp_reward}
      timeLimit={quiz.time_limit_sec}
      backHref={quiz.kind === "review" ? "/practice" : ch ? `/courses/${course.slug}/${ch.number}` : `/courses/${course.slug}`}
      color={course.color}
    />
  );
}
