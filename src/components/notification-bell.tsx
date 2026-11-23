"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({ userId, initial }: { userId: string; initial: number }) {
  const [count, setCount] = useState(initial);
  useEffect(() => {
    const sb = createClient();
    const ch = sb
      .channel("notif-" + userId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () =>
        setCount((c) => c + 1),
      )
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [userId]);
  return (
    <Link href="/notifications" className="btn btn-ghost btn-sm relative" aria-label={`Notifications${count ? `, ${count} unread` : ""}`}>
      <Bell size={18} aria-hidden="true" />
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1 text-[11px] text-white">{count > 9 ? "9+" : count}</span>
      )}
    </Link>
  );
}
