import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Arena } from "./arena";
import { battleLabel } from "@/lib/subjects";

export const metadata: Metadata = { title: "Battle" };
export const dynamic = "force-dynamic";

export default async function BattlePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const me = await requireApproved();
  const sb = await createClient();
  const { data: b } = await sb.from("battles").select("id, code, mode, tier, subject, both_levels, course:courses(title)").eq("code", code.toUpperCase()).maybeSingle();
  if (!b) notFound();
  return <Arena battleId={b.id} code={b.code} mode={b.mode as "1v1" | "2v2"} courseTitle={battleLabel({ tier: b.tier, subject: b.subject, both_levels: b.both_levels, courseTitle: (b.course as { title?: string } | null)?.title })} meId={me.id} />;
}
