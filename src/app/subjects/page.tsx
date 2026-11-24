import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { levelOfTier, inLevel } from "@/lib/levels";
import { subjectName, subjectOf } from "@/lib/subjects";
import { SubjectPicker, type SubjectOption } from "./picker";

export const metadata: Metadata = { title: "Your subjects", robots: { index: false } };
export const dynamic = "force-dynamic";

const LEVEL_NAME: Record<string, string> = { O: "O Level", AS: "AS Level", A: "A Level" };

export default async function Subjects() {
  const me = await getProfile();
  if (!me) redirect("/login");
  if (me.status !== "approved") redirect("/pending");
  if (me.role === "tutor") redirect("/dashboard");
  const level = levelOfTier(me.tier);
  const sb = await createClient();
  const { data: courses } = await sb.from("courses").select("slug, title, code, tier, color, icon, sort").eq("active", true).order("sort");
  const options: SubjectOption[] = [];
  for (const c of (courses || []).filter((c) => inLevel(c.tier, level))) {
    const key = subjectOf(c.slug);
    let o = options.find((x) => x.key === key);
    if (!o) options.push((o = { key, name: subjectName(key), color: c.color, icon: c.icon, courses: [] }));
    o.courses.push(`${LEVEL_NAME[c.tier] || c.tier} ${c.code}`);
  }
  const first = !me.subjects?.length;
  return (
    <main className="mx-auto max-w-2xl p-5 py-10">
      <h1 className="page-title">{first ? `Welcome, ${me.display_name}! 🎉` : "Your subjects"}</h1>
      <p className="mt-2 text-muted">
        {first ? "One last step: which subjects do you take? " : "Change the subjects you take. "}
        You&apos;re in the <b>{level === "O" ? "O Level" : "AS & A Level"}</b> class. Your courses, practice and homework will only show these subjects. You can change this any time from your profile.
      </p>
      <div className="mt-6">
        {options.length ? <SubjectPicker options={options} initial={me.subjects || []} />
          : <div className="card text-muted">No subjects are set up for your level yet. Ask your tutor on Discord.</div>}
      </div>
      {!first && <Link href="/profile" className="btn btn-ghost mt-3 w-full">Cancel</Link>}
    </main>
  );
}
