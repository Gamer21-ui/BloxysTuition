"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function saveSubjects(subjects: string[]) {
  const list = z.array(z.string().regex(/^[a-z-]{2,40}$/)).min(1).max(10).parse(subjects);
  const sb = await createClient();
  const { error } = await sb.rpc("set_my_subjects", { p_subjects: list });
  if (error) return { error: error.message.includes("at least one") ? "Pick at least one subject." : "Couldn't save, try again." };
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
