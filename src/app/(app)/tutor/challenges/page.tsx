import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, SectionTitle } from "@/components/ui";
import { saveChallenge, toggleChallenge } from "../actions";

export const metadata: Metadata = { title: "Challenges (tutor)" };
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  quiz_pass: "Pass N quizzes (60%+)", quiz_specific: "Pass one specific quiz", study_days: "Study on N days",
  homework_on_time: "Hand in N homeworks on time", attendance: "Attend N classes", battle_win: "Win N battles",
  battle_play: "Play N battles", xp_earned: "Earn N XP",
};

export default async function Challenges() {
  await requireTutor();
  const admin = createAdminClient();
  const [{ data: list }, { data: quizzes }] = await Promise.all([
    admin.from("challenges").select("*").order("period").order("title"),
    admin.from("quizzes").select("id, title").order("title"),
  ]);
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">Challenges</h1>
      <Card>
        <form action={saveChallenge} className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2"><label className="label">Title</label><input name="title" required className="input" placeholder="Weekend warrior" /></div>
          <div><label className="label">Resets</label><select name="period" className="input"><option value="daily">daily</option><option value="weekly">weekly</option><option value="once">once (event)</option></select></div>
          <div className="sm:col-span-2"><label className="label">Goal</label><select name="type" className="input">{Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <div><label className="label">N</label><input name="target" type="number" min={1} defaultValue={3} className="input" /></div>
          <div className="sm:col-span-3"><label className="label">Specific quiz (only for “one specific quiz”)</label><select name="quiz_id" className="input"><option value="">–</option>{(quizzes || []).map((q) => <option key={q.id} value={q.id}>{q.title}</option>)}</select></div>
          <div><label className="label">XP</label><input name="xp_reward" type="number" defaultValue={100} className="input" /></div>
          <div><label className="label">Coins</label><input name="coin_reward" type="number" defaultValue={10} className="input" /></div>
          <div />
          <div><label className="label">Starts (optional)</label><input name="starts_on" type="date" className="input" /></div>
          <div><label className="label">Ends (optional)</label><input name="ends_on" type="date" className="input" /></div>
          <div className="sm:col-span-3"><label className="label">Description</label><input name="description" className="input" /></div>
          <button className="btn btn-primary sm:col-span-3">Add challenge</button>
        </form>
      </Card>
      <SectionTitle>All challenges</SectionTitle>
      <Card className="divide-y divide-line p-0">
        {(list || []).map((c) => (
          <div key={c.id} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 ${c.active ? "" : "opacity-50"}`}>
            <span className="chip">{c.period}</span>
            <span className="flex-1"><b>{c.title}</b> <span className="text-sm text-muted">{TYPES[c.type]?.replace("N", String(c.target))} · {c.xp_reward} XP · {c.coin_reward} 🪙</span></span>
            <form action={toggleChallenge}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="active" value={c.active ? "0" : "1"} />
              <button className="btn btn-ghost btn-sm">{c.active ? "Turn off" : "Turn on"}</button></form>
          </div>
        ))}
      </Card>
    </div>
  );
}
