// Subjects a student takes are stored as keys like "economics"; a course's key comes from its slug.
export const subjectOf = (slug: string) => slug.replace(/^(o|as|a)-/, "");

/** Does this student see the course? Tutors and students who haven't picked yet see everything. */
export function takes(me: { role: string; subjects?: string[] | null }, slug: string) {
  if (me.role === "tutor" || !me.subjects?.length) return true;
  return me.subjects.includes(subjectOf(slug));
}

export const SUBJECT_NAMES: Record<string, string> = {
  accounting: "Accounting", business: "Business", economics: "Economics", "computer-science": "Computer Science",
};
export const subjectName = (key: string) => SUBJECT_NAMES[key] || key.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

/** Short label for a battle: "AS Level Economics", "AS + A Level · Mixed", "O Level · Mixed". */
export function battleLabel(b: { tier?: string | null; subject?: string | null; both_levels?: boolean | null; courseTitle?: string | null }) {
  if (b.courseTitle) return b.courseTitle;
  const lvl = b.both_levels ? "AS + A Level" : b.tier === "O" ? "O Level" : b.tier === "AS" ? "AS Level" : b.tier === "A" ? "A Level" : "Any level";
  return b.subject ? `${lvl} ${subjectName(b.subject)}` : `${lvl} · Mixed`;
}

/** " · 4 Software" for a battle limited to one chapter (Supabase may hand the join back as an object or a one-item array). */
export function chapterSuffix(ch: unknown) {
  const c = (Array.isArray(ch) ? ch[0] : ch) as { number?: string; title?: string } | null | undefined;
  return c?.title ? ` · ${c.number} ${c.title}` : "";
}
