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
