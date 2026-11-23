import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, SectionTitle } from "@/components/ui";
import { fmtDateTime } from "@/lib/utils";
import { announce, deleteAnnouncement } from "../actions";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

export default async function Announcements() {
  await requireTutor();
  const { data } = await createAdminClient().from("announcements").select("*").order("created_at", { ascending: false }).limit(30);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">Announcements</h1>
      <Card>
        <form action={announce} className="space-y-3">
          <input name="title" required className="input" placeholder="No class on Saturday" />
          <textarea name="body" required className="input min-h-[120px]" placeholder="Details…" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="discord" defaultChecked /> Also post to Discord</label>
          <button className="btn btn-primary">Send to everyone</button>
        </form>
      </Card>
      <SectionTitle>Sent</SectionTitle>
      <div className="space-y-3">
        {(data || []).map((a) => (
          <Card key={a.id}>
            <div className="flex items-start gap-2"><b className="flex-1">{a.title}</b><span className="text-xs text-muted">{fmtDateTime(a.created_at)}</span></div>
            <p className="mt-1 whitespace-pre-wrap text-sm">{a.body}</p>
            <form action={deleteAnnouncement} className="mt-2"><input type="hidden" name="id" value={a.id} /><button className="text-xs text-bad hover:underline">delete</button></form>
          </Card>
        ))}
      </div>
    </div>
  );
}
