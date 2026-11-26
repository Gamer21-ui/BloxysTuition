import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireApproved } from "@/lib/auth";
import { IpBlaster } from "@/components/arcade/ip-blaster";
import { CpuCommander } from "@/components/arcade/cpu-commander";
import { EmbeddedSorter } from "@/components/arcade/embedded-sorter";

export const metadata: Metadata = { title: "Arcade" };
const MAP = { "ip-blaster": IpBlaster, "cpu-commander": CpuCommander, "embedded-sorter": EmbeddedSorter } as const;

export default async function ArcadeGame({ params }: { params: Promise<{ game: string }> }) {
  await requireApproved();
  const { game } = await params;
  const Game = MAP[game as keyof typeof MAP];
  if (!Game) notFound();
  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/arcade" className="text-sm text-muted hover:underline">← Arcade</Link>
      <div className="mt-2"><Game /></div>
    </div>
  );
}
