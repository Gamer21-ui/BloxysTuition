import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Codes and kinds of the shop items a user owns (server only). */
export async function ownedCodes(userId: string) {
  const { data } = await createAdminClient().from("user_items").select("item:shop_items(code, kind)").eq("user_id", userId);
  return ((data || []) as unknown as { item: { code: string; kind: string } | null }[]).filter((x) => x.item).map((x) => x.item!);
}
