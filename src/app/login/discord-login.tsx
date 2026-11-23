"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DiscordLogin({ next }: { next?: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next && next.startsWith("/") ? next : "/dashboard")}`;
    await createClient().auth.signInWithOAuth({ provider: "discord", options: { redirectTo, scopes: "identify" } });
  }
  return (
    <button onClick={go} disabled={busy} className="btn w-full text-lg text-white" style={{ background: "#5865F2", boxShadow: "0 4px 0 #3c45a5" }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.3 4.4A19.8 19.8 0 0 0 15.4 3l-.6 1.2a18.3 18.3 0 0 0-5.5 0L8.7 3a19.7 19.7 0 0 0-4.9 1.5C.7 9.1-.2 13.7.3 18.2a19.9 19.9 0 0 0 6 3l1.3-2a12.9 12.9 0 0 1-2-1l.5-.4a14.2 14.2 0 0 0 12.2 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.8 19.8 0 0 0 6-3c.6-5.2-.9-9.8-3.8-13.8ZM8.5 15.4c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm7 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" /></svg>
      {busy ? "Opening Discord…" : "Continue with Discord"}
    </button>
  );
}
