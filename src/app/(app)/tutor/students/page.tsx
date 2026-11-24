import type { Metadata } from "next";
import Link from "next/link";
import { requireTutor } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Avatar } from "@/components/avatar";
import { Card, Empty, SectionTitle, StatusChip } from "@/components/ui";
import { levelFromXp } from "@/lib/xp";
import { timeAgo } from "@/lib/utils";
import { StatusButtons } from "./status-buttons";
import type { Profile } from "@/lib/types";
import { subjectName } from "@/lib/subjects";

export const metadata: Metadata = { title: "Students" };
export const dynamic = "force-dynamic";

export default async function Students() {
  await requireTutor();
  const { data } = await createAdminClient().from("profiles").select("*").eq("role", "student").order("created_at", { ascending: false });
  const all = (data as Profile[]) || [];
  const pending = all.filter((s) => s.status === "pending");
  const rest = all.filter((s) => s.status !== "pending").sort((a, b) => b.xp - a.xp);

  const Row = ({ s }: { s: Profile }) => (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <Avatar name={s.display_name} mode={s.avatar_mode} discordUrl={s.discord_avatar_url} robloxUrl={s.roblox_headshot_url} blocky={s.blocky} size={40} />
      <Link href={`/tutor/students/${s.id}`} className="min-w-0 flex-1 hover:underline">
        <div className="font-bold">{s.display_name} <span className="text-sm font-normal text-muted">@{s.discord_username}</span></div>
        <div className="text-xs text-muted">{s.tier} Level · {s.subjects?.length ? s.subjects.map(subjectName).join(", ") : s.status === "approved" ? "subjects not picked yet" : "no subjects yet"} · Lv {levelFromXp(s.xp)} · {s.xp} XP · 🔥 {s.streak} · joined {timeAgo(s.created_at)}</div>
      </Link>
      <StatusChip status={s.status} />
      <StatusButtons id={s.id} status={s.status} tier={s.tier} />
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="page-title">Students</h1>
      <SectionTitle>Waiting for approval ({pending.length})</SectionTitle>
      {pending.length ? <Card className="divide-y divide-line p-0">{pending.map((s) => <Row key={s.id} s={s} />)}</Card>
        : <Empty>Nobody waiting. New students sign in with Discord and show up here.</Empty>}
      <SectionTitle>Everyone ({rest.length})</SectionTitle>
      {rest.length ? <Card className="divide-y divide-line p-0">{rest.map((s) => <Row key={s.id} s={s} />)}</Card> : <Empty>No students yet.</Empty>}
    </div>
  );
}
