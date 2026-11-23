import { NextResponse } from "next/server";
import { z } from "zod";
import { getProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ratelimit";

const body = z.object({ username: z.string().trim().regex(/^[A-Za-z0-9_]{3,20}$/) });

function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  return !origin || origin === new URL(req.url).origin;
}

/** Links a Roblox account by username and stores its public headshot image. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const me = await getProfile();
  if (!me || me.status !== "approved") return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!rateLimit("roblox:" + me.id, 5, 60_000)) return NextResponse.json({ error: "Slow down a bit" }, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "That isn't a valid Roblox username" }, { status: 400 });

  const u = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernames: [parsed.data.username], excludeBannedUsers: true }),
  }).then((r) => r.json()).catch(() => null);
  const user = u?.data?.[0];
  if (!user) return NextResponse.json({ error: "Roblox user not found" }, { status: 404 });

  const t = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`)
    .then((r) => r.json()).catch(() => null);
  const img: string | undefined = t?.data?.[0]?.imageUrl;
  if (!img) return NextResponse.json({ error: "Couldn't load the avatar, try again in a minute" }, { status: 502 });

  await createAdminClient().from("profiles").update({
    roblox_username: user.name, roblox_user_id: user.id, roblox_headshot_url: img,
    avatar_mode: me.avatar_mode === "discord" ? "roblox" : me.avatar_mode,
  }).eq("id", me.id);
  return NextResponse.json({ ok: true, image: img, name: user.name });
}

export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const me = await getProfile();
  if (!me) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  await createAdminClient().from("profiles").update({
    roblox_username: null, roblox_user_id: null, roblox_headshot_url: null,
    avatar_mode: me.avatar_mode === "roblox" || me.avatar_mode === "both" ? "blocky" : me.avatar_mode,
  }).eq("id", me.id);
  return NextResponse.json({ ok: true });
}
