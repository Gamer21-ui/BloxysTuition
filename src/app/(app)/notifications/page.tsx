import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "../actions";
import { NotificationList } from "./notification-list";

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
      <NotificationList items={data || []} />
    </div>
  );
}
