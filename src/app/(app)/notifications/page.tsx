import type { Metadata } from "next";
import Link from "next/link";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { timeAgo } from "@/lib/utils";
import { markAllRead } from "../actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function Notifications() {
  await requireApproved();
  const sb = await createClient();
  const { data } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(60);
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Notifications</h1>
        <form action={markAllRead}><button className="btn btn-ghost btn-sm">Mark all read</button></form>
      </div>
      <div className="mt-6 space-y-2">
        {(data || []).length === 0 && <div className="card text-muted">Nothing yet.</div>}
        {(data || []).map((n) => (
          <Link key={n.id} href={n.link || "#"} className={`card block py-3 ${n.read_at ? "opacity-70" : "border-accent"}`}>
            <div className="font-bold">{n.title}</div>
            {n.body && <div className="text-sm text-muted">{n.body}</div>}
            <div className="text-xs text-muted">{timeAgo(n.created_at)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
