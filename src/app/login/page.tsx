import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { BRAND } from "@/lib/brand";
import { DiscordLogin } from "./discord-login";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  if (await getProfile()) redirect(sp.next || "/dashboard");
  return (
    <main className="grid min-h-dvh place-items-center p-5">
      <div className="card w-full max-w-sm text-center">
        <h1 className="text-3xl">{BRAND.short}</h1>
        <p className="mt-2 text-muted">Sign in with your Discord account. New accounts wait for your tutor to approve them.</p>
        {sp.error && <p className="mt-3 text-sm font-bold text-bad">Sign-in failed. Please try again.</p>}
        <div className="mt-6"><DiscordLogin next={sp.next} /></div>
      </div>
    </main>
  );
}
