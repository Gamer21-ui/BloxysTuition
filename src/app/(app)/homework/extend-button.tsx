"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** "Use extension (+48h)" on one piece of homework. */
export function ExtendButton({ id, have }: { id: string; have: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  if (have <= 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={async () => {
        setBusy(true); setErr(null);
        const { error } = await createClient().rpc("use_extension", { p_assignment: id });
        setBusy(false);
        if (error) setErr(error.message); else router.refresh();
      }}>⏳ Use extension (+48h) · you have {have}</button>
      {err && <span className="text-xs font-bold text-bad">{err}</span>}
    </div>
  );
}
