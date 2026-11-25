"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { Countdown } from "@/components/countdown";

type S = { id: number; name: string; starts_at: string; ends_at: string; status: string };
// <input type="datetime-local"> works in local time; show and save in Mauritius time (UTC+4)
const toMu = (iso: string) => new Date(+new Date(iso) + 4 * 3600_000).toISOString().slice(0, 16);
const fromMu = (v: string) => new Date(v + ":00+04:00").toISOString();

/** Tutor HQ card: current/next season dates, edit them, or end the season now and hand out rewards. */
export function SeasonControl({ season }: { season: S | null }) {
  const router = useRouter();
  const [start, setStart] = useState(season ? toMu(season.starts_at) : "");
  const [end, setEnd] = useState(season ? toMu(season.ends_at) : "");
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);
  if (!season) return <Card><h2 className="text-lg">🏁 Seasons</h2><p className="text-sm text-muted">Run the seasons SQL update in Supabase to turn seasons on.</p></Card>;
  const live = season.status === "active";
  async function save() {
    const { error } = await createClient().rpc("tutor_set_season", { p_id: season!.id, p_starts: fromMu(start), p_ends: fromMu(end) });
    setMsg(error ? { t: error.message, bad: true } : { t: "Dates saved." }); router.refresh();
  }
  async function endNow() {
    const { error } = await createClient().rpc("tutor_end_season", { p_id: season!.id });
    setConfirm(false);
    setMsg(error ? { t: error.message, bad: true } : { t: "Season ended: rewards sent and the next season is set up." }); router.refresh();
  }
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg">🏁 {season.name} <span className="text-sm font-normal text-muted">{live ? "· live" : "· upcoming"}</span></h2>
        <span className="text-sm text-muted">{live ? "Ends in" : "Starts in"} <Countdown to={live ? season.ends_at : season.starts_at} className="font-bold text-ink" /></span>
      </div>
      <p className="text-sm text-muted">At the end, the top 10 on Season XP and Ranked get titles, the Season frame/name style and coins automatically. Ranked resets when a season starts. Times are Mauritius time.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm"><span className="label">Starts</span><input type="datetime-local" className="input" value={start} disabled={live} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="text-sm"><span className="label">Ends</span><input type="datetime-local" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-ghost" onClick={save}>Save dates</button>
        {live && (confirm
          ? <><button className="btn btn-primary" onClick={endNow}>Yes, end it and give rewards</button><button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button></>
          : <button className="btn btn-ghost" onClick={() => setConfirm(true)}>End season now</button>)}
      </div>
      {msg && <p className={msg.bad ? "text-sm font-bold text-bad" : "text-sm font-bold text-good"}>{msg.t}</p>}
    </Card>
  );
}
