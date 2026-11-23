import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Codes and kinds of the shop items a user owns (server only). */
export async function ownedCodes(userId: string, isTutor = false) {
  const admin = createAdminClient();
  const { data } = await admin.from("user_items").select("item:shop_items(code, kind)").eq("user_id", userId);
  const owned = ((data || []) as unknown as { item: { code: string; kind: string } | null }[]).filter((x) => x.item).map((x) => x.item!);
  if (isTutor) {
    // owner exclusives are always available to the tutor
    const { data: ex } = await admin.from("shop_items").select("code, kind").eq("tutor_only", true);
    owned.push(...(ex || []));
  }
  return owned;
}
