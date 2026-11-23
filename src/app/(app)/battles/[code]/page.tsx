import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Arena } from "./arena";

export const metadata: Metadata = { title: "Battle" };
export const dynamic = "force-dynamic";

export default async function BattlePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const me = await requireApproved();
  const sb = await createClient();
  const { data: b } = await sb.from("battles").select("id, code, mode, course:courses(title)").eq("code", code.toUpperCase()).maybeSingle();
  if (!b) notFound();
  return <Arena battleId={b.id} code={b.code} mode={b.mode as "1v1" | "2v2"} courseTitle={(b.course as { title?: string } | null)?.title || "All subjects"} meId={me.id} />;
}
