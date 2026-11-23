import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** The signed-in user's profile, or null. Cached per request. */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims?.sub;
  if (!uid) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
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
