import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Avatar } from "@/components/avatar";
import { Card, SectionTitle, StatusChip } from "@/components/ui";
import { levelFromXp, rankName } from "@/lib/xp";
import { fmtDate, timeAgo } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { addNote, awardBonus, createReport, deleteNote, setTopic, updateStudent } from "../../actions";
import { StatusButtons } from "../status-buttons";

export const metadata: Metadata = { title: "Student" };
export const dynamic = "force-dynamic";

export default async function Student({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireTutor();
  const admin = createAdminClient();
  const { data: s } = await admin.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!s) notFound();
  const p = s as Profile;
  const [{ data: notes }, { data: topics }, { data: chapters }, { data: attempts }, { data: att }, { data: subs }, { data: reports }] = await Promise.all([
    admin.from("tutor_notes").select("id, body, created_at").eq("student_id", id).order("created_at", { ascending: false }),
    admin.from("student_topics").select("chapter_id, label").eq("student_id", id),
    admin.from("chapters").select("id, number, title, course:courses(code, sort)").order("sort"),
    admin.from("quiz_attempts").select("score, total, flagged, finished_at, xp_awarded, quiz:quizzes(title)").eq("user_id", id).not("finished_at", "is", null).order("finished_at", { ascending: false }).limit(12),
    admin.from("attendance").select("status").eq("user_id", id),
    admin.from("submissions").select("score, graded_at, assignment:assignments(title, max_score)").eq("user_id", id).order("submitted_at", { ascending: false }).limit(8),
    admin.from("reports").select("id, period_label, created_at, shared_with_student").eq("student_id", id).order("created_at", { ascending: false }),
  ]);
  const topicOf = new Map((topics || []).map((t) => [t.chapter_id, t.label]));
  const chs = ((chapters || []) as unknown as { id: string; number: string; title: string; course: { code: string; sort: number } }[])
    .sort((a, b) => a.course.sort - b.course.sort);
  const a = att || [];
  const pres = a.filter((x) => x.status === "present" || x.status === "late").length;
  const lvl = levelFromXp(p.xp);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/tutor/students" className="text-sm text-muted hover:underline">← Students</Link>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <Avatar name={p.display_name} mode={p.avatar_mode} discordUrl={p.discord_avatar_url} robloxUrl={p.roblox_headshot_url} blocky={p.blocky} size={72} />
        <div className="flex-1">
          <h1 className="page-title mb-0">{p.display_name}</h1>
          <div className="text-muted">@{p.discord_username} · Lv {lvl} {rankName(lvl)} · {p.xp} XP · 🪙 {p.coins} · 🔥 {p.streak} (best {p.best_streak})</div>
        </div>
        <StatusChip status={p.status} />
        <StatusButtons id={p.id} status={p.status} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-lg">Details</h2>
          <form action={updateStudent} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="id" value={p.id} />
            <div><label className="label">Display name</label><input name="display_name" className="input" defaultValue={p.display_name} /></div>
            <div><label className="label">Studying at</label>
              <select name="tier" className="input" defaultValue={p.tier}><option value="O">O Level</option><option value="AS">AS Level</option><option value="A">A Level</option></select></div>
            <div><label className="label">Student contact</label><input name="contact" className="input" defaultValue={p.contact || ""} /></div>
            <div><label className="label">Title on profile</label><input name="title" className="input" defaultValue={p.title || ""} placeholder="e.g. Ledger Legend" /></div>
            <div><label className="label">Parent / guardian name</label><input name="parent_name" className="input" defaultValue={p.parent_name || ""} /></div>
            <div><label className="label">Parent contact</label><input name="parent_contact" className="input" defaultValue={p.parent_contact || ""} /></div>
            <button className="btn btn-primary btn-sm sm:col-span-2">Save details</button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 text-lg">Bonus XP / coins</h2>
          <form action={awardBonus} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="id" value={p.id} />
            <div><label className="label">XP</label><input name="xp" type="number" min={0} max={2000} defaultValue={50} className="input" /></div>
            <div><label className="label">Coins</label><input name="coins" type="number" min={0} max={500} defaultValue={0} className="input" /></div>
            <div className="sm:col-span-3"><label className="label">Reason (they see this)</label><input name="reason" required className="input" placeholder="Extra past paper done 💪" /></div>
            <button className="btn btn-accent btn-sm sm:col-span-3">Award</button>
          </form>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
            <div className="card p-2"><div className="font-display text-xl">{a.length ? Math.round((100 * pres) / a.length) : "–"}{a.length ? "%" : ""}</div>attendance</div>
            <div className="card p-2"><div className="font-display text-xl">{attempts?.length || 0}</div>recent quizzes</div>
            <div className="card p-2"><div className="font-display text-xl">{subs?.filter((x) => x.graded_at).length || 0}</div>marked HW</div>
          </div>
        </Card>
      </div>

      <SectionTitle>🔒 Private notes <span className="text-sm font-normal text-muted">(only you can see these)</span></SectionTitle>
      <Card className="space-y-3">
        <form action={addNote} className="flex gap-2">
          <input type="hidden" name="id" value={p.id} />
          <textarea name="body" required className="input min-h-[60px]" placeholder="Struggles with depreciation methods; prefers worked examples…" />
          <button className="btn btn-primary btn-sm self-end">Add</button>
        </form>
        {(notes || []).map((n) => (
          <div key={n.id} className="flex items-start gap-3 rounded border-2 border-line p-3">
            <p className="flex-1 whitespace-pre-wrap text-sm">{n.body}</p>
            <span className="text-xs text-muted">{fmtDate(n.created_at)}</span>
            <form action={deleteNote}><input type="hidden" name="id" value={n.id} /><input type="hidden" name="student" value={p.id} /><button className="text-xs text-bad hover:underline">delete</button></form>
          </div>
        ))}
      </Card>

      <SectionTitle>Weak / strong topics <span className="text-sm font-normal text-muted">(they see these on their courses page)</span></SectionTitle>
      <Card className="max-h-[420px] divide-y divide-line overflow-y-auto p-0">
        {chs.map((c) => {
          const cur = topicOf.get(c.id) || "none";
          return (
            <form key={c.id} action={setTopic} className="flex items-center gap-2 px-4 py-2 text-sm">
              <input type="hidden" name="student" value={p.id} /><input type="hidden" name="chapter" value={c.id} />
              <span className="w-14 text-xs text-muted">{c.course.code}</span>
              <span className="flex-1">{c.number}. {c.title}</span>
              {(["weak", "none", "strong"] as const).map((l) => (
                <button key={l} name="label" value={l} className={`chip ${cur === l ? (l === "weak" ? "bg-bad text-white" : l === "strong" ? "bg-good text-white" : "bg-surface2") : "opacity-60"}`}>{l === "none" ? "–" : l}</button>
              ))}
            </form>
          );
        })}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <SectionTitle>Recent quizzes</SectionTitle>
          <Card className="divide-y divide-line p-0 text-sm">
            {(attempts || []).map((q, i) => (
              <div key={i} className="flex justify-between px-4 py-2">
                <span>{(q.quiz as unknown as { title: string })?.title} {q.flagged && <span className="chip text-warn">fast</span>}</span>
                <span className="text-muted">{q.score}/{q.total} · +{q.xp_awarded} XP · {timeAgo(q.finished_at!)}</span>
              </div>
            ))}
            {!attempts?.length && <p className="p-4 text-muted">None yet.</p>}
          </Card>
        </div>
        <div>
          <SectionTitle>Homework</SectionTitle>
          <Card className="divide-y divide-line p-0 text-sm">
            {(subs || []).map((h, i) => {
              const as = h.assignment as unknown as { title: string; max_score: number };
              return <div key={i} className="flex justify-between px-4 py-2"><span>{as?.title}</span><span className="text-muted">{h.graded_at ? `${h.score}/${as?.max_score}` : "to mark"}</span></div>;
            })}
            {!subs?.length && <p className="p-4 text-muted">None yet.</p>}
          </Card>
        </div>
      </div>

      <SectionTitle>🧾 Parent progress report</SectionTitle>
      <Card>
        <form action={createReport} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="id" value={p.id} />
          <div><label className="label">Period</label><input name="period" required className="input" placeholder="November 2026" /></div>
          <div><label className="label">Covering the last</label>
            <select name="days" className="input" defaultValue="30"><option value="14">2 weeks</option><option value="30">month</option><option value="90">3 months</option><option value="180">6 months</option></select></div>
          <div><label className="label">Parent name</label><input name="parent_name" className="input" defaultValue={p.parent_name || ""} /></div>
          <div className="sm:col-span-3"><label className="label">Your comment</label><textarea name="comment" required className="input min-h-[110px]" placeholder="Strong month overall. Ledgers are now confident…" /></div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" name="share" /> Let {p.display_name} see it too</label>
          <button className="btn btn-primary btn-sm">Generate receipt</button>
        </form>
        {!!reports?.length && (
          <div className="mt-4 flex flex-wrap gap-2">
            {reports.map((r) => <Link key={r.id} href={`/reports/${r.id}`} className="chip hover:underline">🧾 {r.period_label} {r.shared_with_student && "· shared"}</Link>)}
          </div>
        )}
      </Card>
    </div>
  );
}
