import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/brand";
import { levelFromXp, rankName } from "@/lib/xp";
import { toggleReportShare } from "../../tutor/actions";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Progress report" };
export const dynamic = "force-dynamic";

type Stats = {
  student: string; tier: string; days: number;
  attendance: { sessions: number; present: number; pct: number | null };
  quizzes: { count: number; subjects: { subject: string; quizzes: number; pct: number }[] };
  homework: { handed_in: number; on_time: number; avg_pct: number | null };
  xp_gained: number; total_xp: number; streak: number; best_streak: number; achievements: number;
  strong: string[]; weak: string[];
};

const EXAM = new Date("2027-10-01T00:00:00+04:00"); // Cambridge O Level November series starts around October

function Row({ k, v }: { k: string; v: string | number }) {
  return <div className="row"><span>{k}</span><span className="font-bold">{v}</span></div>;
}

export default async function Report({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireApproved();
  const sb = await createClient();
  const { data: r } = await sb.from("reports").select("*").eq("id", id).maybeSingle();
  if (!r) notFound();
  const s = r.stats as Stats;
  const tutor = me.role === "tutor";
  const lvl = levelFromXp(s.total_xp);
  const weeks = Math.max(0, Math.ceil((+EXAM - +new Date(r.created_at)) / (7 * 86400_000)));
  const no = r.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const issued = new Date(r.created_at).toLocaleString("en-GB", { timeZone: "Indian/Mauritius", dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-md pb-16">
      <div className="no-print mb-6 flex flex-wrap items-center gap-2">
        <Link href={tutor ? `/tutor/students/${r.student_id}` : "/dashboard"} className="btn btn-ghost btn-sm">← Back</Link>
        <PrintButton />
        {tutor && (
          <form action={toggleReportShare}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="share" value={r.shared_with_student ? "0" : "1"} />
            <button className="btn btn-ghost btn-sm">{r.shared_with_student ? "Hide from student" : "Share with student"}</button>
          </form>
        )}
      </div>

      <article className="receipt text-[13px] leading-relaxed">
        <header className="text-center">
          <div className="text-lg font-bold uppercase tracking-wide">{BRAND.name}</div>
          <div>Private tuition · {BRAND.location}</div>
          <div className="mt-1">*** PROGRESS RECEIPT ***</div>
        </header>
        <hr />
        <Row k="Receipt no." v={no} />
        <Row k="Issued" v={issued} />
        <Row k="Period" v={r.period_label} />
        <hr />
        <Row k="Billed to (parent)" v={r.parent_name || "Parent / guardian"} />
        <Row k="Student" v={s.student} />
        <Row k="Level of study" v={`${s.tier} Level`} />
        <hr />
        <div className="mb-1 font-bold">ITEMS · last {s.days} days</div>
        <Row k="Classes attended" v={s.attendance.sessions ? `${s.attendance.present}/${s.attendance.sessions} (${s.attendance.pct}%)` : "no classes logged"} />
        <Row k="Quizzes completed" v={s.quizzes.count} />
        {s.quizzes.subjects.map((x) => <Row key={x.subject} k={`  ${x.subject}`} v={`${x.pct}% avg`} />)}
        <Row k="Homework handed in" v={s.homework.handed_in} />
        <Row k="  …on time" v={s.homework.on_time} />
        <Row k="  Average mark" v={s.homework.avg_pct === null ? "–" : `${s.homework.avg_pct}%`} />
        <Row k="Badges earned" v={s.achievements} />
        <Row k="Study streak (best)" v={`${s.streak} (${s.best_streak}) days`} />
        <Row k="XP earned" v={`+${s.xp_gained.toLocaleString()}`} />
        {(s.strong.length > 0 || s.weak.length > 0) && <hr />}
        {s.strong.length > 0 && <div><b>STRONG:</b> {s.strong.join(", ")}</div>}
        {s.weak.length > 0 && <div><b>NEEDS WORK:</b> {s.weak.join(", ")}</div>}
        <hr />
        <div className="row text-base"><span>TOTAL</span><span className="font-bold">Lv {lvl} · {rankName(lvl)}</span></div>
        <div className="row"><span>Lifetime XP</span><span>{s.total_xp.toLocaleString()}</span></div>
        <hr />
        <div className="mb-1 font-bold">TUTOR&apos;S NOTE</div>
        <p className="whitespace-pre-wrap">{r.comment}</p>
        <hr />
        <div className="text-center">
          <div>O Level exams: Oct–Nov 2027{weeks > 0 ? ` · ~${weeks} weeks to go` : ""}</div>
          <div className="mt-3 select-none text-2xl leading-none tracking-[-0.08em]" aria-hidden="true">
            {no.split("").map((c: string) => "▌▍▎▏▋▊".charAt(c.charCodeAt(0) % 6)).join("").repeat(4)}
          </div>
          <div className="mt-1 text-xs">THANK YOU FOR TRUSTING US · KEEP GRINDING</div>
        </div>
      </article>
    </div>
  );
}
