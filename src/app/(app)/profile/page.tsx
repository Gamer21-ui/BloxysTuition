import type { Metadata } from "next";
import { requireApproved } from "@/lib/auth";
import { Card, SectionTitle } from "@/components/ui";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { levelFromXp } from "@/lib/xp";
import { AvatarEditor } from "./avatar-editor";
import { ownedCodes } from "@/lib/shop";

export const metadata: Metadata = { title: "Profile" };

export default async function Profile() {
  const me = await requireApproved();
  const owned = await ownedCodes(me.id, me.role === "tutor");
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="page-title">Profile</h1>
      <SectionTitle>Theme</SectionTitle>
      <ThemeSwitcher userId={me.id} initial={me.theme} />
      <SectionTitle>Avatar</SectionTitle>
      <AvatarEditor
        level={levelFromXp(me.xp)}
        ownedHats={owned.filter((o) => o.kind === "hat").map((o) => o.code)}
        ownedPatterns={owned.filter((o) => o.kind === "pattern").map((o) => o.code)}
        ownedFace={owned.filter((o) => o.kind === "face_acc").map((o) => o.code)}
        ownedBack={owned.filter((o) => o.kind === "back").map((o) => o.code)}
        frame={me.frame}
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
