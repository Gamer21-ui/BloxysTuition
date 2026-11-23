import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** The signed-in user's profile, or null. Cached per request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
});

export async function requireApproved() {
  const p = await getProfile();
  if (!p) redirect("/login");
  if (p.status !== "approved") redirect("/pending");
  return p;
}

export async function requireTutor() {
  const p = await requireApproved();
  if (p.role !== "tutor") redirect("/dashboard");
  return p;
}
