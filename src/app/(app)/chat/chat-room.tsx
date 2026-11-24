"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Send, Swords, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import type { Card as PCard } from "@/lib/types";
import { cn } from "@/lib/utils";

type Msg = { id: number; user_id: string; body: string; kind: "text" | "battle"; battle_code: string | null; mode: string | null; tier: "O" | "AS" | "A" | null; course_title: string | null; deleted: boolean; created_at: string };
const LEVELS = [{ id: "O", label: "O Level" }, { id: "AS", label: "AS Level" }, { id: "A", label: "A Level" }] as const;
const FILTER_KEY = "fb_chat_levels";

export function ChatRoom({ meId, isTutor, myTier }: { meId: string; isTutor: boolean; myTier: string }) {
  const sb = useMemo(() => createClient(), []);
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [cards, setCards] = useState<Record<string, PCard>>({});
  const [levels, setLevels] = useState<string[]>(["O", "AS", "A"]);
  const [onlyBattles, setOnlyBattles] = useState(false);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [mode, setMode] = useState<"1v1" | "2v2">("1v1");
  const [tier, setTier] = useState(myTier as "O" | "AS" | "A");
  const bottom = useRef<HTMLDivElement>(null);

  // level filter is remembered on this device
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(FILTER_KEY) || "null"); if (Array.isArray(v) && v.length) setLevels(v); } catch { /* ignore */ }
  }, []);
  const toggleLevel = (id: string) => {
    const next = levels.includes(id) ? levels.filter((l) => l !== id) : [...levels, id];
    if (!next.length) return;
    setLevels(next);
    try { localStorage.setItem(FILTER_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const load = useCallback(async () => {
    const { data } = await sb.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(100);
    const list = ((data as Msg[]) || []).reverse();
    setMsgs(list);
    const missing = [...new Set(list.map((m) => m.user_id))].filter((id) => !cards[id]);
    if (missing.length) {
      const { data: c } = await sb.rpc("profile_cards", { p_ids: missing });
      if (c) setCards((x) => ({ ...x, ...Object.fromEntries((c as PCard[]).map((k) => [k.id, k])) }));
    }
  }, [sb, cards]);

  useEffect(() => {
    load();
    const ch = sb.channel("chat").on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => load()).subscribe();
    return () => { sb.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setErr(null); setPosting(true);
    const { error } = await sb.rpc("post_chat", { p_body: text, p_battle_code: null });
    setPosting(false);
    if (error) return setErr(error.message);
    setText(""); load();
  }
  async function postBattle() {
    setErr(null); setPosting(true);
    const { data: code, error } = await sb.rpc("create_battle", { p_mode: mode, p_course: null, p_rounds: 5, p_tier: tier });
    if (error) { setPosting(false); return setErr(error.message); }
    const { error: e2 } = await sb.rpc("post_chat", { p_body: text.trim() || `${mode} battle, who's in?`, p_battle_code: code });
    setPosting(false);
    if (e2) return setErr(e2.message);
    router.push(`/battles/${code}`);
  }
  async function join(code: string) {
    setErr(null);
    const { error } = await sb.rpc("join_battle", { p_code: code, p_team: null });
    if (error) return setErr(error.message.includes("started") ? "That battle already started." : error.message);
    router.push(`/battles/${code}`);
  }

  const shown = msgs.filter((m) => (m.kind === "battle" ? !m.tier || levels.includes(m.tier) : !onlyBattles) && (!m.deleted || isTutor));
  const fresh = (m: Msg) => Date.now() - +new Date(m.created_at) < 30 * 60_000;

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-3xl flex-col lg:h-[calc(100dvh-6rem)]">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="page-title mb-0 mr-auto">Chat</h1>
        <Filter size={16} className="text-muted" aria-hidden="true" />
        {LEVELS.map((l) => (
          <button key={l.id} onClick={() => toggleLevel(l.id)} aria-pressed={levels.includes(l.id)}
            className={cn("chip", levels.includes(l.id) ? "bg-primary text-primary-ink" : "opacity-60")}>{l.label}</button>
        ))}
        <button onClick={() => setOnlyBattles((x) => !x)} aria-pressed={onlyBattles} className={cn("chip", onlyBattles && "bg-accent text-white")}><Swords size={12} aria-hidden="true" /> battles only</button>
      </div>
      <p className="mt-1 text-xs text-muted">The level filter chooses which battle requests you see. Be kind, your tutor can see everything here.</p>

      <div className="card mt-3 flex-1 space-y-3 overflow-y-auto">
        {!shown.length && <p className="py-10 text-center text-muted">No messages yet. Say hi or post a battle!</p>}
        {shown.map((m) => {
          const c = cards[m.user_id];
          return (
            <div key={m.id} className={cn("flex gap-2.5", m.deleted && "opacity-40")}>
              <Avatar name={c?.display_name || "?"} mode={(c?.avatar_mode as PCard["avatar_mode"]) || "discord"} discordUrl={c?.discord_avatar_url} robloxUrl={c?.roblox_headshot_url} blocky={c?.blocky} size={36} frame={c?.frame} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-bold"><NameTag name={c?.display_name || "…"} style={c?.name_style} /></span>
                  <span className="text-xs text-muted">{new Date(m.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                  {(m.user_id === meId || isTutor) && !m.deleted && (
                    <button className="ml-auto text-muted hover:text-bad" title="Delete" onClick={() => sb.rpc("delete_chat", { p_id: m.id }).then(load)}><Trash2 size={13} aria-hidden="true" /></button>
                  )}
                </div>
                {m.kind === "battle" ? (
                  <div className="mt-1 flex flex-wrap items-center gap-3 rounded-xl border-2 border-accent bg-accent/10 p-2.5">
                    <Swords className="text-accent" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{m.mode} battle · {m.tier === "O" ? "O Level" : m.tier === "AS" ? "AS Level" : m.tier === "A" ? "A Level" : "any level"}{m.course_title ? ` · ${m.course_title.replace(/^(O|AS|A) Level /, "")}` : ""}</div>
                      <div className="text-sm">{m.body} <span className="font-mono text-xs text-muted">{m.battle_code}</span></div>
                    </div>
                    {m.user_id !== meId && fresh(m) && <button className="btn btn-primary btn-sm" onClick={() => join(m.battle_code!)}>Join</button>}
                    {!fresh(m) && <span className="chip text-xs text-muted">old</span>}
                  </div>
                ) : <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      {showNew && (
        <div className="card mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold">New battle:</span>
          {(["1v1", "2v2"] as const).map((x) => <button key={x} className={cn("btn btn-sm", mode === x ? "btn-primary" : "btn-ghost")} onClick={() => setMode(x)}>{x}</button>)}
          <select className="input h-8 w-auto py-0 text-sm" value={tier} onChange={(e) => setTier(e.target.value as "O" | "AS" | "A")} aria-label="Level">
            {LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button className="btn btn-accent btn-sm ml-auto" disabled={posting} onClick={postBattle}><Swords size={14} aria-hidden="true" /> Create &amp; post</button>
        </div>
      )}
      <form onSubmit={send} className="mt-2 flex gap-2">
        <button type="button" className={cn("btn", showNew ? "btn-accent" : "btn-ghost")} onClick={() => setShowNew((x) => !x)} title="Post a battle request"><Swords size={18} aria-label="Post a battle" /></button>
        <input className="input flex-1" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={showNew ? "Optional message for your battle request" : "Message"} aria-label="Message" />
        <button className="btn btn-primary" disabled={posting || (!text.trim() && !showNew)} type={showNew ? "button" : "submit"} onClick={showNew ? postBattle : undefined}><Send size={18} aria-label="Send" /></button>
      </form>
      {err && <p className="mt-1 text-sm font-bold text-bad" role="alert">{err}</p>}
    </div>
  );
}
