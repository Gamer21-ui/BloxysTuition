import { NextResponse } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Hands out short-lived download links for private files after checking the user may see them:
 *  - resources:   the resource row must be visible to the user (RLS decides)
 *  - solutions:   the assignment's answers must have been released
 *  - submissions: your own files, or the tutor
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const bucket = url.searchParams.get("bucket") || "";
  const path = url.searchParams.get("path") || "";
  const me = await getProfile();
  if (!me || me.status !== "approved") return NextResponse.redirect(new URL("/login", req.url));
  if (!rateLimit("files:" + me.id, 60, 60_000)) return new NextResponse("Too many requests", { status: 429 });
  if (!path || path.includes("..")) return new NextResponse("Bad path", { status: 400 });

  const sb = await createClient();
  const tutor = me.role === "tutor";
  let ok = tutor;
  if (!ok && bucket === "resources") {
    const [{ data: r }, { data: a }] = await Promise.all([
      sb.from("resources").select("id").eq("file_path", path).limit(1),
      sb.from("assignments").select("id").eq("file_path", path).limit(1),
    ]);
    ok = !!(r?.length || a?.length);
  } else if (!ok && bucket === "solutions") {
    // two plain .eq() filters (no string-built filter, so a crafted path can't change the query)
    const [{ data: a1 }, { data: a2 }] = await Promise.all([
      sb.from("assignments").select("id").eq("answers_released", true).eq("solution_path", path).limit(1),
      sb.from("assignments").select("id").eq("answers_released", true).eq("mark_scheme_path", path).limit(1),
    ]);
    ok = !!(a1?.length || a2?.length);
  } else if (!ok && bucket === "submissions") {
    ok = path.startsWith(me.id + "/");
  }
  if (!ok || !["resources", "solutions", "submissions"].includes(bucket)) return new NextResponse("Not allowed", { status: 403 });

  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUrl(path, 120);
  if (error || !data) return new NextResponse("File not found", { status: 404 });
  return NextResponse.redirect(data.signedUrl);
}
