"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Tutor-only: starts a live lesson for a visualization and opens the cockpit. */
export function GoLiveButton({ viz, small }: { viz: string; small?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <>
      <button className={`btn btn-accent ${small ? "btn-sm" : "btn-sm"}`} disabled={busy} onClick={async () => {
        setBusy(true); setErr(null);
        const { error } = await createClient().rpc("live_start", { p_viz: viz });
        if (error) { setErr(error.message.includes("function") ? "Run the live-lessons SQL update first." : error.message); setBusy(false); return; }
        router.push("/live");
      }}><Radio size={16} /> {busy ? "Starting…" : "Go live"}</button>
      {err && <span className="text-xs text-bad">{err}</span>}
    </>
  );
}
