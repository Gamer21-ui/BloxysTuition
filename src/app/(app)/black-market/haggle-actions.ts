"use server";
/**
 * Haggling with the Black Market seller. Everything is checked and written here with the service
 * role; students can only READ their haggles, so the discount can't be faked from the browser.
 */
import { z } from "zod";
import { requireApproved } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_TURNS, adjust, sellerReply, tierOf, type Line } from "@/lib/haggle";
import { intelFor } from "@/lib/seller";

const DAILY_HAGGLES = 5;
type Out = { ok: true; id: string; reply: string; discount: number; turnsLeft: number; cap: number } | { ok: false; error: string };

export async function haggleSay(input: { id?: string | null; item: "bunk" | "skip"; text: string }): Promise<Out> {
  const me = await requireApproved();
  if (me.role !== "student") return { ok: false, error: "The seller doesn't haggle with the owner. 😳" };
  const item = z.enum(["bunk", "skip"]).parse(input.item);
  const text = String(input.text || "").replace(/\s+/g, " ").trim().slice(0, 300);
  if (text.length < 1) return { ok: false, error: "Say something, kid." };
  const admin = createAdminClient();

  let row: { id: string; messages: Line[]; turns: number; score: number; status: string; expires_at: string; user_id: string; item: string } | null = null;
  if (input.id) {
    const { data } = await admin.from("black_market_haggles").select("*").eq("id", z.string().uuid().parse(input.id)).maybeSingle();
    if (!data || data.user_id !== me.id || data.item !== item) return { ok: false, error: "That conversation isn't yours." };
    if (data.status !== "open" || new Date(data.expires_at) < new Date()) return { ok: false, error: "This conversation is over. Start a new one." };
    if (data.turns >= MAX_TURNS) return { ok: false, error: "He's done talking. Shake on it or walk away." };
    row = data;
  } else {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { count, error } = await admin.from("black_market_haggles").select("id", { count: "exact", head: true }).eq("user_id", me.id).gte("created_at", since);
    if (error) return { ok: false, error: "The alley's closed for haggling (the database update isn't in yet)." };
    if ((count || 0) >= DAILY_HAGGLES) return { ok: false, error: "\"I've haggled with you enough today. Come back tomorrow.\"" };
    const { count: used } = await admin.from("black_market_log").select("id", { count: "exact", head: true }).eq("user_id", me.id).eq("item", item);
    if ((used || 0) >= 3) return { ok: false, error: "It's broken. He won't sell you another." };
    const { data, error: e2 } = await admin.from("black_market_haggles").insert({ user_id: me.id, item }).select("*").single();
    if (e2 || !data) return { ok: false, error: "Couldn't start haggling. Try again." };
    row = data;
  }

  const history = (row!.messages || []) as Line[];
  const intel = await intelFor(me.id);
  const said = await sellerReply(item, history, text, row!.score, intel);
  const turns = row!.turns + 1;
  const t = tierOf(adjust(said.score, intel), turns, intel.cap);
  const messages = [...history, { from: "me", text }, { from: "seller", text: said.reply }];
  await admin.from("black_market_haggles").update({ messages, turns, score: t.score, discount: t.discount }).eq("id", row!.id);
  return { ok: true, id: row!.id, reply: said.reply, discount: t.discount, turnsLeft: MAX_TURNS - turns, cap: intel.cap };
}

/** Lock in the current offer: valid for 15 minutes, used once by black_market_buy. */
export async function haggleShake(id: string): Promise<{ ok: true; discount: number } | { ok: false; error: string }> {
  const me = await requireApproved();
  const admin = createAdminClient();
  const { data } = await admin.from("black_market_haggles").select("user_id, status, discount, expires_at").eq("id", z.string().uuid().parse(id)).maybeSingle();
  if (!data || data.user_id !== me.id) return { ok: false, error: "That deal isn't yours." };
  if (data.status !== "open" || new Date(data.expires_at) < new Date()) return { ok: false, error: "Too late, the deal's gone." };
  if (!data.discount) return { ok: false, error: "\"There's no deal on the table yet, kid.\"" };
  await admin.from("black_market_haggles").update({ status: "deal", expires_at: new Date(Date.now() + 15 * 60_000).toISOString() }).eq("id", id);
  return { ok: true, discount: data.discount };
}

export async function haggleWalk(id: string) {
  const me = await requireApproved();
  await createAdminClient().from("black_market_haggles").update({ status: "walked" }).eq("id", z.string().uuid().parse(id)).eq("user_id", me.id).eq("status", "open");
}
