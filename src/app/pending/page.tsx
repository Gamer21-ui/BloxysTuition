import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Hourglass } from "lucide-react";
import { getProfile } from "@/lib/auth";
import { AutoRefresh } from "./auto-refresh";

export const metadata: Metadata = { title: "Waiting for approval", robots: { index: false } };

export const dynamic = "force-dynamic";

export default async function Pending() {
  const me = await getProfile();
  if (!me) redirect("/login");
  if (me.status === "approved") redirect("/dashboard");
  const invite = process.env.NEXT_PUBLIC_DISCORD_INVITE;
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      {me.status === "pending" && <AutoRefresh />}
      <div className="card max-w-md text-center">
        <Hourglass className="mx-auto text-warn" size={40} aria-hidden="true" />
        <h1 className="mt-3 text-3xl">{me.status === "suspended" ? "Account paused" : "Almost in!"}</h1>
        <p className="mt-2 text-muted">
          {me.status === "suspended"
            ? "Your account has been paused by your tutor. Message them on Discord if you think this is a mistake."
            : `Hey ${me.display_name}, your tutor needs to approve your account. Ping them on Discord. This page lets you in by itself as soon as you're approved.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {invite && <a href={invite} className="btn btn-accent" target="_blank" rel="noopener noreferrer">Open Discord</a>}
          <form action="/auth/signout" method="post"><button className="btn btn-ghost">Sign out</button></form>
        </div>
      </div>
    </main>
  );
}
