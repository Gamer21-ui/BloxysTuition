import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { takes } from "@/lib/subjects";
import { BlackMarket } from "./black-market";
import { greeting, intelFor } from "@/lib/seller";

export const metadata: Metadata = { title: "🕳️", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function BlackMarketPage() {
  const me = await requireApproved();
  const sb = await createClient();
  const since = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const [{ data: status, error }, { data: asg }, { data: subs }, { data: ovs }, { data: abs }] = await Promise.all([
    sb.rpc("black_market_status"),
    sb.from("assignments").select("id, title, due_at, course:courses(slug, title)").order("due_at", { ascending: true, nullsFirst: false }),
    sb.from("submissions").select("assignment_id").eq("user_id", me.id),
    sb.from("assignment_overrides").select("assignment_id, exempt").eq("user_id", me.id),
    sb.from("attendance").select("session_id, status, session:class_sessions!inner(title, held_on)").eq("user_id", me.id).eq("status", "absent").gte("session.held_on", since),
  ]);
  const handed = new Set((subs || []).map((s) => s.assignment_id));
  const skipped = new Set((ovs || []).filter((o) => o.exempt).map((o) => o.assignment_id));
  type A = { id: string; title: string; due_at: string | null; course: { slug: string; title: string } | null };
  const homework = ((asg as unknown as A[]) || [])
    .filter((a) => !handed.has(a.id) && !skipped.has(a.id) && (!a.course || takes(me, a.course.slug)))
    .map((a) => ({ id: a.id, label: `${a.title}${a.course ? ` · ${a.course.title}` : ""}` }));
  type B = { session_id: string; session: { title: string; held_on: string } };
  const absences = ((abs as unknown as B[]) || []).map((b) => ({ id: b.session_id, label: `${b.session.title} · ${new Date(b.session.held_on).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` }));
  // Mr. Shades sizes you up: mood of the day, owner online?, your leaderboard rank, have you been studying?
  // count this visit (and find out about overdue homework / the loiterer tax)
  const { data: v } = me.role === "student" ? await sb.rpc("black_market_visit") : { data: null };
  const intel = me.role === "student" ? await intelFor(me.id, (v as never) ?? { week: 0, overdue: 0, tax: 0 }) : null;
  const shades = intel ? {
    mood: `${intel.mood.emoji} ${intel.mood.name}`, hello: greeting(intel, me.display_name), cap: intel.cap, capReason: intel.capReason,
    tax: intel.tax, visits: intel.visitsWeek, overdue: intel.overdue,
  } : null;
  return (
    <BlackMarket isTutor={me.role === "tutor"} ready={!error && !!status} status={status as never} coins={me.coins} xp={me.xp}
      homework={homework} absences={absences} shades={shades} />
  );
}
