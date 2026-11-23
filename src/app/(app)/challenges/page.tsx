import type { Metadata } from "next";
import { CheckCircle2, Coins, Sparkles } from "lucide-react";
import { requireApproved } from "@/lib/auth";
import { getChallenges, type ChallengeRow } from "@/lib/data";
import { Bar, Card, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Challenges" };

function Row({ c }: { c: ChallengeRow }) {
  const p = Math.min(c.progress, c.target);
  return (
    <Card className={`flex items-center gap-4 ${c.completed ? "border-good" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-display text-lg">{c.title}</span>
          <span className="flex gap-2 text-sm font-bold">
            <span className="text-xp"><Sparkles size={14} className="inline" aria-hidden="true" /> {c.xp_reward} XP</span>
            <span className="text-coin"><Coins size={14} className="inline" aria-hidden="true" /> {c.coin_reward}</span>
          </span>
        </div>
        {c.description && <p className="text-sm text-muted">{c.description}</p>}
        <div className="mt-2 flex items-center gap-3"><Bar pct={(p / c.target) * 100} color={c.completed ? "rgb(var(--good))" : undefined} /><span className="whitespace-nowrap text-sm font-bold">{p}/{c.target}</span></div>
      </div>
      {c.completed && <CheckCircle2 className="shrink-0 text-good" size={28} aria-label="Completed" />}
    </Card>
  );
}

export default async function Challenges() {
  const me = await requireApproved();
  const all = await getChallenges(me.id);
  return (
    <div>
      <h1 className="page-title">Challenges</h1>
      <p className="mt-1 text-muted">Daily quests reset at midnight (Mauritius time). Weekly ones reset on Monday.</p>
      <SectionTitle>Daily</SectionTitle>
      <div className="space-y-3">{all.filter((c) => c.period === "daily").map((c) => <Row key={c.id} c={c} />)}</div>
      <SectionTitle>Weekly</SectionTitle>
      <div className="space-y-3">{all.filter((c) => c.period === "weekly").map((c) => <Row key={c.id} c={c} />)}</div>
      {all.some((c) => c.period === "once") && (
        <>
          <SectionTitle>Special</SectionTitle>
          <div className="space-y-3">{all.filter((c) => c.period === "once").map((c) => <Row key={c.id} c={c} />)}</div>
        </>
      )}
    </div>
  );
}
