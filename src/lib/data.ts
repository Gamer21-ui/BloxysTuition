import "server-only";
import { createClient } from "@/lib/supabase/server";

export type ChallengeRow = {
  id: string; title: string; description: string | null; period: string; type: string; target: number;
  xp_reward: number; coin_reward: number; progress: number; completed: boolean;
};

function periodKey(period: string) {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Indian/Mauritius" }));
  if (period === "daily") return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (period === "weekly") {
    // ISO week (matches to_char(..., 'IYYY-"W"IW') in Postgres)
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }
  return "once";
}

export async function getChallenges(userId: string): Promise<ChallengeRow[]> {
  const sb = await createClient();
  const [{ data: ch }, { data: prog }] = await Promise.all([
    sb.from("challenges").select("*").eq("active", true).order("period").order("xp_reward"),
    sb.from("challenge_progress").select("*").eq("user_id", userId),
  ]);
  return (ch || []).map((c) => {
    const p = (prog || []).find((x) => x.challenge_id === c.id && x.period_key === periodKey(c.period));
    return { ...c, progress: p?.progress ?? 0, completed: !!p?.completed_at };
  });
}

export async function getCourseProgress(userId: string) {
  const sb = await createClient();
  const [{ data: courses }, { data: quizzes }, { data: attempts }] = await Promise.all([
    sb.from("courses").select("*").order("sort"),
    sb.from("quizzes").select("id, course_id, kind").eq("kind", "quiz"),
    sb.from("quiz_attempts").select("quiz_id, score, total, flagged").eq("user_id", userId).not("finished_at", "is", null),
  ]);
  const passed = new Set((attempts || []).filter((a) => !a.flagged && a.total && a.score * 2 >= a.total).map((a) => a.quiz_id));
  return (courses || []).map((c) => {
    const qs = (quizzes || []).filter((q) => q.course_id === c.id);
    const done = qs.filter((q) => passed.has(q.id)).length;
    return { ...c, total: qs.length, done, pct: qs.length ? Math.round((done / qs.length) * 100) : 0 };
  });
}
