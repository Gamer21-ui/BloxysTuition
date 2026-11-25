import type { Metadata } from "next";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Poll } from "@/components/live-poll";
import { PollsDesk } from "./polls-desk";

export const metadata: Metadata = { title: "Live polls" };
export const dynamic = "force-dynamic";

export default async function PollsPage() {
  await requireTutor();
  const admin = createAdminClient();
  const [{ data: polls }, { data: studs }] = await Promise.all([
    admin.from("polls").select("*").order("created_at", { ascending: false }).limit(15),
    admin.from("profiles").select("id, display_name").eq("role", "student").eq("status", "approved"),
  ]);
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">📊 Live polls</h1>
      <p className="text-muted">Ask a question and it pops up on every student&apos;s screen straight away. Results update live as they vote.</p>
      <PollsDesk initial={(polls as Poll[]) || []} students={studs || []} />
    </div>
  );
}
