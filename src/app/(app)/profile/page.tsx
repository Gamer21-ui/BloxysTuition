import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { Card, SectionTitle } from "@/components/ui";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { levelFromXp } from "@/lib/xp";
import { AvatarEditor } from "./avatar-editor";

export const metadata: Metadata = { title: "Profile" };

export default async function Profile() {
  const me = await requireApproved();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">Profile</h1>
      <SectionTitle>Theme</SectionTitle>
      <ThemeSwitcher userId={me.id} initial={me.theme} />
      <SectionTitle>Avatar</SectionTitle>
      <AvatarEditor
        level={levelFromXp(me.xp)}
        initial={{ mode: me.avatar_mode, blocky: me.blocky, displayName: me.display_name, roblox: me.roblox_username, robloxImg: me.roblox_headshot_url, discordImg: me.discord_avatar_url }}
      />
      <SectionTitle>Account</SectionTitle>
      <Card className="space-y-1 text-sm">
        <div><span className="text-muted">Discord:</span> {me.discord_username || "–"}</div>
        <div><span className="text-muted">Level of study:</span> {me.tier} Level <span className="text-muted">(set by your tutor; studying above it gives an XP boost)</span></div>
        <form action="/auth/signout" method="post" className="pt-3"><button className="btn btn-ghost btn-sm">Sign out</button></form>
      </Card>
    </div>
  );
}
