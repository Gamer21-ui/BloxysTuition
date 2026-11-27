import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { IpBlaster } from "@/components/arcade/ip-blaster";
import { CpuCommander } from "@/components/arcade/cpu-commander";
import { EmbeddedSorter } from "@/components/arcade/embedded-sorter";
import { TraceMaster } from "@/components/arcade/trace-master";
import { TRACE_SETS } from "@/lib/trace-programs";
import { PRO_SET } from "@/lib/trace-pro";
import { OrderRaceLobby } from "@/components/arcade/order-race-lobby";
import { ARCADE } from "@/lib/arcade";
import { createClient } from "@/lib/supabase/server";
import { isLive } from "@/lib/utils";

export const metadata: Metadata = { title: "Arcade" };
const MAP = { "ip-blaster": IpBlaster, "cpu-commander": CpuCommander, "embedded-sorter": EmbeddedSorter } as const;

export default async function ArcadeGame({ params }: { params: Promise<{ game: string }> }) {
  const me = await requireApproved();
  const { game } = await params;
  const back = <Link href="/arcade" className="text-sm text-muted hover:underline">← Arcade</Link>;
  if (game === "trace-master") {
    // Pro programs are only sent to students on Special Training (and the tutor)
    const special = me.role === "tutor" || !!me.special;
    const sets = special ? [...TRACE_SETS, PRO_SET] : TRACE_SETS;
    const defaultKey = special && me.tier !== "O" ? "pro" : me.tier === "O" ? "o" : me.tier === "AS" ? "as" : "a";
    return <div className="mx-auto max-w-4xl">{back}<div className="mt-2"><TraceMaster sets={sets} defaultKey={defaultKey} /></div></div>;
  }
  if (game === "order-race") {
    // chapters that have race puzzles and are open to students
    const sb = await createClient();
    const where = ARCADE.find((g) => g.slug === "order-race")!.where[0];
    const { data: course } = await sb.from("courses").select("id").eq("slug", where.course).single();
    if (!course) notFound();
    const { data: chs } = await sb.from("chapters").select("id, number, title, status, release_at, sort").eq("course_id", course.id).order("sort");
    const open = (chs || []).filter((c) => where.chapters.includes(String(c.number)) && (me.role === "tutor" || isLive(c.status, c.release_at)));
    return <div className="mx-auto max-w-3xl">{back}<div className="mt-2"><OrderRaceLobby courseId={course.id} chapters={open} /></div></div>;
  }
  const Game = MAP[game as keyof typeof MAP];
  if (!Game) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      {back}
      <div className="mt-2"><Game /></div>
    </div>
  );
}
