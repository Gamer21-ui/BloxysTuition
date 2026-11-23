import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, Empty, SectionTitle } from "@/components/ui";
import { fmtDate } from "@/lib/utils";
import { createSession } from "../actions";
import { MarkButtons } from "./mark-buttons";

export const metadata: Metadata = { title: "Attendance" };
export const dynamic = "force-dynamic";

export default async function Attendance() {
  await requireTutor();
  const admin = createAdminClient();
  const today = new Date(Date.now() + 4 * 3600_000).toISOString().slice(0, 10);
  const [{ data: courses }, { data: sessions }, { data: studs }] = await Promise.all([
    admin.from("courses").select("id, title").order("sort"),
    admin.from("class_sessions").select("id, title, held_on, course:courses(title), attendance(user_id, status)").order("held_on", { ascending: false }).limit(15),
    admin.from("profiles").select("id, display_name").eq("role", "student").eq("status", "approved").order("display_name"),
  ]);
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="page-title">Attendance</h1>
      <p className="text-muted">Present gives 40 XP, late 20, the first time you mark them in for a class. Switching to absent later does not take XP back.</p>
      <Card className="mt-4">
        <form action={createSession} className="grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2"><label className="label">Class</label><input name="title" required className="input" placeholder="Accounts: ledgers recap" /></div>
          <div><label className="label">Subject</label><select name="course" className="input"><option value="">Mixed</option>{(courses || []).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
          <div><label className="label">Date</label><input name="held_on" type="date" defaultValue={today} className="input" /></div>
          <button className="btn btn-primary btn-sm sm:col-span-4">Add class</button>
        </form>
      </Card>
      <SectionTitle>Recent classes</SectionTitle>
      {!sessions?.length && <Empty>No classes logged yet.</Empty>}
      <div className="space-y-4">
        {(sessions || []).map((s) => {
          const marks = new Map(((s.attendance as { user_id: string; status: string }[]) || []).map((a) => [a.user_id, a.status]));
          return (
            <details key={s.id} className="card" open={s.held_on === today}>
              <summary className="cursor-pointer"><b>{s.title}</b> <span className="text-sm text-muted">{fmtDate(s.held_on, { weekday: "short", day: "numeric", month: "short" })} · {(s.course as { title?: string } | null)?.title || "Mixed"} · {marks.size}/{studs?.length || 0} marked</span></summary>
              <div className="mt-3 divide-y divide-line">
                {(studs || []).map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="flex-1">{u.display_name}</span>
                    <MarkButtons session={s.id} user={u.id} current={marks.get(u.id) || null} />
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
