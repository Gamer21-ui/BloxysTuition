"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui";
import { Confetti } from "@/components/confetti";
import { PrestigeBadge } from "@/components/prestige-badge";
import { MAX_PRESTIGE, PRESTIGE_LEVEL, prestigeRewards } from "@/lib/prestige";
import { levelProgress, xpForLevel } from "@/lib/xp";

export function PrestigeCard({ xp, prestige, lifetime }: { xp: number; prestige: number; lifetime: number }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const lp = levelProgress(xp);
  const ready = lp.level >= PRESTIGE_LEVEL && prestige < MAX_PRESTIGE;
  const pct = Math.min(100, (xp / xpForLevel(PRESTIGE_LEVEL)) * 100);
  const next = prestige + 1;
  async function go() {
    setBusy(true); setErr(null);
    const { error } = await createClient().rpc("do_prestige");
    setBusy(false);
    if (error) return setErr(error.message);
    setDone(true); setConfirm(false);
    setTimeout(() => router.refresh(), 1800);
  }
  return (
    <Card className="space-y-3">
      {done && <Confetti count={90} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-xl">Prestige <PrestigeBadge n={prestige} /></div>
        <div className="text-xs text-muted">Lifetime XP: {(lifetime + xp).toLocaleString()}</div>
      </div>
      {prestige >= MAX_PRESTIGE ? (
        <p className="text-sm">💠 You&apos;re <b>Master Prestige</b>, the highest there is. Legend.</p>
      ) : (
        <>
          <p className="text-sm text-muted">Reach <b className="text-ink">Level {PRESTIGE_LEVEL}</b> to prestige: your level goes back to 1, you keep everything you own and every unlock,
            and you get <b className="text-ink">{prestigeRewards(next).join(", ")}</b>.</p>
          <div>
            <div className="mb-1 flex justify-between text-xs font-bold text-muted"><span>Level {lp.level} / {PRESTIGE_LEVEL}</span><span>{Math.round(pct)}%</span></div>
            <div className="bar h-3"><i style={{ width: `${pct}%`, background: ready ? "rgb(var(--xp))" : "rgb(var(--accent))" }} /></div>
          </div>
          {ready && !confirm && <button className="btn btn-primary w-full" onClick={() => setConfirm(true)}>⭐ Prestige now</button>}
          {confirm && (
            <div className="rounded border-2 border-warn p-3 text-sm">
              <p className="font-bold">Are you sure?</p>
              <p className="mt-1 text-muted">Your level resets to 1 (your XP moves into Lifetime XP, so leaderboards still count it). You keep all items, coins and unlocks. This can&apos;t be undone.</p>
              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary" disabled={busy} onClick={go}>{busy ? "Prestiging…" : `Yes, go to Prestige ${next}`}</button>
                <button className="btn btn-ghost" onClick={() => setConfirm(false)}>Not yet</button>
              </div>
            </div>
          )}
          {done && <p className="text-center font-display text-2xl text-xp">⭐ Prestige {next}!</p>}
          {err && <p className="text-sm font-bold text-bad">{err}</p>}
        </>
      )}
    </Card>
  );
}
