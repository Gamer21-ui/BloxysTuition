"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/** Pings "I'm here" every minute while the tab is open, so the site knows who's online. */
export function Heartbeat() {
  useEffect(() => {
    const sb = createClient();
    const ping = () => { if (document.visibilityState === "visible") sb.rpc("touch_seen").then(() => {}); };
    ping();
    const t = setInterval(ping, 60_000);
    document.addEventListener("visibilitychange", ping);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", ping); };
  }, []);
  return null;
}
