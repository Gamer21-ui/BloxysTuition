"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApproved } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/ratelimit";

const ALLOWED = /\.(pdf|png|jpe?g|webp|heic|docx?|xlsx?|txt)$/i;

async function visibleAssignment(id: string) {
  const sb = await createClient();
  const { data } = await sb.from("assignments").select("id, title").eq("id", id).maybeSingle();
  if (!data) throw new Error("Assignment not found");
  return data;
}

/** One-time upload link so the browser can send the file straight to storage (no size limit on our server). */
export async function getUploadUrl(assignmentId: string, filename: string) {
  const me = await requireApproved();
  z.string().uuid().parse(assignmentId);
  if (!rateLimit("upload:" + me.id, 20, 60_000)) throw new Error("Too many uploads, wait a minute");
  if (!ALLOWED.test(filename)) throw new Error("Upload a PDF, photo, Word or Excel file");
  await visibleAssignment(assignmentId);
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
  const path = `${me.id}/${assignmentId}/${Date.now()}-${safe}`;
  const { data, error } = await createAdminClient().storage.from("submissions").createSignedUploadUrl(path);
  if (error || !data) throw new Error("Couldn't prepare the upload");
  return { path, token: data.token };
}

const submitSchema = z.object({
  assignmentId: z.string().uuid(),
  paths: z.array(z.string().max(300)).max(10),
  text: z.string().max(5000).optional(),
});

export async function submitHomework(input: z.infer<typeof submitSchema>) {
  const me = await requireApproved();
  const { assignmentId, paths, text } = submitSchema.parse(input);
  const a = await visibleAssignment(assignmentId);
  if (paths.some((p) => !p.startsWith(`${me.id}/${assignmentId}/`))) throw new Error("Bad file");
  if (!paths.length && !text?.trim()) throw new Error("Add a file or an answer first");
  const admin = createAdminClient();
  const { data: existing } = await admin.from("submissions").select("id, graded_at").eq("assignment_id", assignmentId).eq("user_id", me.id).maybeSingle();
  if (existing?.graded_at) throw new Error("Already marked, ask your tutor if you need to resubmit");
  const { error } = await admin.from("submissions").upsert(
    { assignment_id: assignmentId, user_id: me.id, file_paths: paths, text_answer: text?.trim() || null, submitted_at: new Date().toISOString() },
    { onConflict: "assignment_id,user_id" },
  );
  if (error) throw new Error(error.message);
  const { data: tutors } = await admin.from("profiles").select("id").eq("role", "tutor");
  if (tutors?.length) {
    await admin.from("notifications").insert(tutors.map((t) => ({ user_id: t.id, title: `${me.display_name} handed in ${a.title}`, body: null, link: "/tutor/homework" })));
  }
  revalidatePath("/homework");
}
