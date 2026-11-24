"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, Crown, LogOut, Search, Swords, UserMinus, UserPlus, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { Card, SectionTitle } from "@/components/ui";
import type { BlockyConfig, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type P = { id: string; display_name: string; avatar_mode: Profile["avatar_mode"]; discord_avatar_url: string | null; roblox_headshot_url: string | null; blocky: BlockyConfig; title: string | null; level: number; tier: string; name_style: string | null; frame: string | null; role: string };
type F = { requester: string; addressee: string; status: "pending" | "accepted" };
type Party = { id: string; leader_id: string; battle_code: string | null };
type Invite = { party_id: string; from_id: string; to_id: string };

export function FriendsHub({ meId }: { meId: string }) {
  const sb = useMemo(() => createClient(), []);
  const [people, setPeople] = useState<P[]>([]);
  const [fr, setFr] = useState<F[]>([]);
  const [party, setParty] = useState<Party | null>(null);
  const [members, setMembers] = useState<string[]>([]);
  const [sent, setSent] = useState<Invite[]>([]);
  const [incoming, setIncoming] = useState<Invite[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ t: string; bad?: boolean } | null>(null);

  const load = useCallback(async () => {
    const [{ data: dir }, { data: f }, { data: mine }, { data: inv }] = await Promise.all([
      sb.rpc("student_directory"),
      sb.from("friendships").select("requester, addressee, status"),
      sb.from("party_members").select("party_id").eq("user_id", meId).maybeSingle(),
      sb.from("party_invites").select("party_id, from_id, to_id"),
    ]);
    setPeople((dir as P[]) || []);
    setFr((f as F[]) || []);
    const invites = (inv as Invite[]) || [];
    setIncoming(invites.filter((i) => i.to_id === meId));
    if (mine?.party_id) {
      const [{ data: pt }, { data: pm }] = await Promise.all([
        sb.from("parties").select("id, leader_id, battle_code").eq("id", mine.party_id).maybeSingle(),
        sb.from("party_members").select("user_id").eq("party_id", mine.party_id).order("joined_at"),
      ]);
      setParty(pt as Party | null);
      setMembers((pm || []).map((m) => m.user_id));
      setSent(invites.filter((i) => i.party_id === mine.party_id && i.to_id !== meId));
    } else { setParty(null); setMembers([]); setSent([]); }
  }, [sb, meId]);

  useEffect(() => {
    load();
    const ch = sb.channel("friends:" + meId);
    for (const t of ["friendships", "party_members", "party_invites", "parties"]) ch.on("postgres_changes", { event: "*", schema: "public", table: t }, load);
    ch.subscribe();
    return () => { sb.removeChannel(ch); };
  }, [sb, meId, load]);

  async function rpc(fn: string, args: Record<string, unknown>, ok?: string) {
    setMsg(null);
    const { error } = await sb.rpc(fn, args);
    if (error) setMsg({ t: error.message, bad: true }); else if (ok) setMsg({ t: ok });
    load();
  }

  const byId = (id: string) => people.find((p) => p.id === id);
  const friends = fr.filter((f) => f.status === "accepted").map((f) => (f.requester === meId ? f.addressee : f.requester));
  const requestsIn = fr.filter((f) => f.status === "pending" && f.addressee === meId).map((f) => f.requester);
  const requestsOut = fr.filter((f) => f.status === "pending" && f.requester === meId).map((f) => f.addressee);
  const iLead = !party || party.leader_id === meId;
  const others = people.filter((p) => p.id !== meId && !friends.includes(p.id) && p.display_name.toLowerCase().includes(q.toLowerCase()));

  const Person = ({ id, children }: { id: string; children?: React.ReactNode }) => {
    const p = byId(id);
    if (!p) return null;
    return (
      <div className="flex items-center gap-3 py-2">
        <Avatar name={p.display_name} mode={p.avatar_mode} discordUrl={p.discord_avatar_url} robloxUrl={p.roblox_headshot_url} blocky={p.blocky} size={44} frame={p.frame} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold"><NameTag name={p.display_name} style={p.name_style} /> {party?.leader_id === id && <Crown size={14} className="inline text-xp" aria-label="Party leader" />}</div>
          <div className="text-xs text-muted">Lv {p.level} · {p.role === "tutor" ? "Tutor" : `${p.tier === "O" ? "O" : p.tier} Level`}{p.title ? ` · ${p.title}` : ""}</div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">{children}</div>
      </div>
    );
  };

  return (
    <div className="mt-4 space-y-6">
      {msg && <p className={cn("text-sm font-bold", msg.bad ? "text-bad" : "text-good")} role="status">{msg.t}</p>}

      {incoming.length > 0 && (
        <Card className="ring-2 ring-accent">
          <h2 className="mb-1 text-lg">Party invites</h2>
          {incoming.map((i) => (
            <Person key={i.party_id} id={i.from_id}>
              <button className="btn btn-primary btn-sm" onClick={() => rpc("party_accept", { p_party: i.party_id }, "You joined the party")}><Check size={14} aria-hidden="true" /> Join</button>
              <button className="btn btn-ghost btn-sm" onClick={() => rpc("party_decline", { p_party: i.party_id })}><X size={14} aria-hidden="true" /></button>
            </Person>
          ))}
        </Card>
      )}

      <div>
        <SectionTitle><Users className="mr-1 inline" aria-hidden="true" /> Your party {party && <span className="text-sm font-normal text-muted">({members.length}/4)</span>}</SectionTitle>
        <Card>
          {!party ? (
            <p className="text-sm text-muted">You&apos;re not in a party. Invite a friend below to start one. You&apos;ll be the leader.</p>
          ) : (
            <>
              {party.battle_code && (
                <Link href={`/battles/${party.battle_code}`} className="btn btn-accent mb-3 w-full"><Swords size={16} aria-hidden="true" /> Party battle {party.battle_code}: go</Link>
              )}
              <div className="divide-y divide-line">
                {members.map((id) => (
                  <Person key={id} id={id}>
                    {id === meId ? <span className="chip">you</span> : party.leader_id === meId ? <button className="btn btn-ghost btn-sm" onClick={() => rpc("party_kick", { p_user: id })}>Remove</button> : null}
                  </Person>
                ))}
                {sent.map((i) => <Person key={i.to_id} id={i.to_id}><span className="chip text-muted">invited…</span></Person>)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {party.leader_id === meId && <Link href="/battles" className="btn btn-primary btn-sm"><Swords size={14} aria-hidden="true" /> Start a party battle</Link>}
                <button className="btn btn-ghost btn-sm" onClick={() => rpc("party_leave", {}, party.leader_id === meId ? "Party closed" : "You left the party")}><LogOut size={14} aria-hidden="true" /> {party.leader_id === meId ? "Close party" : "Leave party"}</button>
              </div>
              {party.leader_id !== meId && <p className="mt-2 text-xs text-muted">When your leader starts or joins a battle you&apos;re added automatically and get a notification.</p>}
            </>
          )}
        </Card>
      </div>

      {requestsIn.length > 0 && (
        <div>
          <SectionTitle>Friend requests</SectionTitle>
          <Card className="divide-y divide-line">
            {requestsIn.map((id) => (
              <Person key={id} id={id}>
                <button className="btn btn-primary btn-sm" onClick={() => rpc("respond_friend_request", { p_user: id, p_accept: true }, "Friend added")}><Check size={14} aria-hidden="true" /> Accept</button>
                <button className="btn btn-ghost btn-sm" onClick={() => rpc("respond_friend_request", { p_user: id, p_accept: false })}><X size={14} aria-hidden="true" /></button>
              </Person>
            ))}
          </Card>
        </div>
      )}

      <div>
        <SectionTitle>Friends ({friends.length})</SectionTitle>
        <Card className="divide-y divide-line">
          {!friends.length && <p className="py-2 text-sm text-muted">No friends yet. Find people below.</p>}
          {friends.map((id) => (
            <Person key={id} id={id}>
              {iLead && !members.includes(id) && !sent.some((s) => s.to_id === id) && (
                <button className="btn btn-accent btn-sm" onClick={() => rpc("party_invite", { p_user: id }, "Party invite sent")}><Users size={14} aria-hidden="true" /> Invite to party</button>
              )}
              <button className="btn btn-ghost btn-sm" title="Remove friend" onClick={() => { if (confirm("Remove this friend?")) rpc("remove_friend", { p_user: id }); }}><UserMinus size={14} aria-hidden="true" /></button>
            </Person>
          ))}
        </Card>
      </div>

      <div>
        <SectionTitle>Find players</SectionTitle>
        <Card>
          <label className="relative block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input className="input pl-9" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="mt-2 divide-y divide-line">
            {others.map((p) => (
              <Person key={p.id} id={p.id}>
                {requestsOut.includes(p.id) ? <span className="chip text-muted">request sent</span>
                  : requestsIn.includes(p.id) ? <span className="chip text-accent">wants to be friends ↑</span>
                  : <button className="btn btn-primary btn-sm" onClick={() => rpc("send_friend_request", { p_user: p.id }, "Request sent")}><UserPlus size={14} aria-hidden="true" /> Add</button>}
              </Person>
            ))}
            {!others.length && <p className="py-2 text-sm text-muted">Nobody else to add.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
