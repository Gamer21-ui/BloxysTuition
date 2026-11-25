"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";

/** Tutor HQ card: show the site tour to every student (live for anyone online) or preview it yourself. */
export function TutorialControl({ launchedAt }: { launchedAt: string | null }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const [confirm, setConfirm] = useState(false);
  async function launch() {
    setBusy(true); setMsg(null);
    const { error } = await createClient().rpc("relaunch_tutorial");
    setBusy(false); setConfirm(false);
    setMsg(error ? { text: error.message.includes("relaunch_tutorial") ? "Run the tutorial SQL update in Supabase first." : error.message, bad: true }
      : { text: "Launched! Everyone online sees the tour now; everyone else gets it next time they open the site." });
  }
  return (
    <Card className="space-y-3">
      <div>
        <h2 className="text-lg">🧭 Site tour</h2>
        <p className="text-sm text-muted">A quick walkthrough of every section. New students get it automatically. Launch it for everyone at the start of a session to get them used to the site.
          {launchedAt && <> Last launched {new Date(launchedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}.</>}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {confirm ? (
          <>
            <button className="btn btn-primary" disabled={busy} onClick={launch}>{busy ? "Launching…" : "Yes, show it to everyone"}</button>
            <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Cancel</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => setConfirm(true)}>Show tour to everyone</button>
        )}
        <button className="btn btn-ghost" onClick={() => window.dispatchEvent(new Event("fb:tutorial"))}>Preview it</button>
      </div>
      {msg && <p className={msg.bad ? "text-sm font-bold text-bad" : "text-sm font-bold text-good"} role="status">{msg.text}</p>}
    </Card>
  );
}
