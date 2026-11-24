"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Swords, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Pops up anywhere on the site when your party leader puts the party into a battle. */
export function PartyBanner({ meId }: { meId: string }) {
  const sb = useMemo(() => createClient(), []);
  const path = usePathname();
  const [code, setCode] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    let partyId: string | null = null;
    const check = async () => {
      const { data: m } = await sb.from("party_members").select("party_id").eq("user_id", meId).maybeSingle();
      partyId = m?.party_id ?? null;
      if (!partyId) return setCode(null);
      const { data: p } = await sb.from("parties").select("battle_code, leader_id").eq("id", partyId).maybeSingle();
      if (!p || p.leader_id === meId || !p.battle_code) return setCode(null);
      const { data: b } = await sb.from("battles").select("status").eq("code", p.battle_code).maybeSingle();
      setCode(b && (b.status === "lobby" || b.status === "live") ? p.battle_code : null);
    };
    check();
    const ch = sb.channel("party-banner:" + meId)
      .on("postgres_changes", { event: "*", schema: "public", table: "parties" }, check)
      .on("postgres_changes", { event: "*", schema: "public", table: "party_members" }, check)
      .subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, meId]);

  if (!code || dismissed === code || path.startsWith(`/battles/${code}`)) return null;
  return (
    <div className="fixed inset-x-3 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border-2 border-accent bg-surface p-3 shadow-2xl lg:bottom-6">
      <Swords className="shrink-0 text-accent" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm"><b>Your party is in a battle!</b><div className="text-muted">Code {code}</div></div>
      <Link href={`/battles/${code}`} className="btn btn-primary btn-sm">Join</Link>
      <button onClick={() => setDismissed(code)} className="p-1 text-muted" aria-label="Dismiss"><X size={18} aria-hidden="true" /></button>
    </div>
  );
}
