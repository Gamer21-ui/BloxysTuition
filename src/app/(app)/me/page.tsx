import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/avatar";
import { NameTag } from "@/components/name-tag";
import { HubTile } from "@/components/hub-tile";
import { levelProgress, rankName } from "@/lib/xp";

export const metadata: Metadata = { title: "Me" };

export default async function Me() {
  const me = await requireApproved();
  const sb = await createClient();
  const [{ count: fr }, { count: inv }, { count: unread }] = await Promise.all([
    sb.from("friendships").select("requester", { count: "exact", head: true }).eq("addressee", me.id).eq("status", "pending"),
    sb.from("party_invites").select("party_id", { count: "exact", head: true }).eq("to_id", me.id),
    sb.from("notifications").select("id", { count: "exact", head: true }).is("read_at", null),
  ]);
  const lp = levelProgress(me.xp);
  return (
    <div className="mx-auto max-w-4xl">
      <div className="card flex items-center gap-4">
        <Avatar name={me.display_name} mode={me.avatar_mode} discordUrl={me.discord_avatar_url} robloxUrl={me.roblox_headshot_url} blocky={me.blocky} size={72} frame={me.frame} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl"><NameTag name={me.display_name} style={me.name_style} /></h1>
          <div className="text-sm text-muted">Lv {lp.level} {rankName(lp.level)} · 🔥 {me.streak}-day streak · 🪙 {me.coins}</div>
          <div className="bar mt-2 h-2.5"><i style={{ width: `${lp.pct}%`, background: "rgb(var(--xp))" }} /></div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <HubTile href="/profile" emoji="⚙️" title="Profile" text="Avatar, theme, name, prestige" />
        <HubTile href="/achievements" emoji="🏅" title="Achievements" text="Badges, titles and what's next" />
        <HubTile href="/friends" emoji="👥" title="Friends" text="Friends, requests and party invites" badge={(fr || 0) + (inv || 0)} />
        <HubTile href="/chat" emoji="💬" title="Chat" text="Talk with your class" />
        <HubTile href="/notifications" emoji="🔔" title="Notifications" text="Everything you've been sent" badge={unread || 0} />
        {(me.role === "tutor" || me.special) && <HubTile href="/special" emoji="🌟" title="Special Training" text="Your exclusive exam guides and programming ladder" accent />}
      </div>
      <form action="/auth/signout" method="post" className="mt-6 text-center"><button className="btn btn-ghost">Sign out</button></form>
    </div>
  );
}
