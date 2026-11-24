"use server";
/**
 * Every tutor write lives here. Each action re-checks the tutor role on the server before
 * touching the database with the service-role client, so hidden buttons are never the only guard.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireTutor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { postToDiscord, siteUrl } from "@/lib/discord";

const uuid = z.string().uuid();
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opt = (fd: FormData, k: string) => str(fd, k) || null;
const num = (fd: FormData, k: string, d = 0) => { const n = Number(fd.get(k)); return Number.isFinite(n) ? n : d; };
/** datetime-local inputs are Mauritius time (UTC+4, no DST). */
const mu = (v: string | null) => (v ? new Date(v.length === 16 ? v + ":00+04:00" : v).toISOString() : null);
const pub = z.enum(["draft", "locked", "scheduled", "published"]);

async function fail(msg: string): Promise<never> { throw new Error(msg); }

// ---------------------------------------------------------------- uploads
export async function tutorUploadUrl(bucket: "resources" | "solutions", folder: string, filename: string) {
  await requireTutor();
  if (!/^[a-z0-9/-]{1,80}$/i.test(folder)) await fail("bad folder");
  const safe = filename.replace(/[^A-Za-z0-9._-]/g, "_").slice(-80);
  const path = `${folder}/${Date.now()}-${safe}`;
  const { data, error } = await createAdminClient().storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) await fail("Couldn't prepare upload");
  return { path, token: data!.token };
}

// ---------------------------------------------------------------- students
export async function setStudentStatus(id: string, status: "approved" | "suspended" | "pending", tier?: "O" | "AS" | "A") {
  await requireTutor();
  uuid.parse(id); z.enum(["approved", "suspended", "pending"]).parse(status);
  const admin = createAdminClient();
  const patch: Record<string, string> = { status };
  if (tier) patch.tier = z.enum(["O", "AS", "A"]).parse(tier);
  await admin.from("profiles").update(patch).eq("id", id).neq("role", "tutor");
  if (status === "approved") {
    await admin.from("notifications").insert({ user_id: id, title: "You're in! 🎉", body: "Your tutor approved your account. Pick a theme and start your first quiz.", link: "/profile" });
  }
  revalidatePath("/tutor/students");
}

export async function updateStudent(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  await createAdminClient().from("profiles").update({
    tier: z.enum(["O", "AS", "A"]).parse(str(fd, "tier")),
    display_name: z.string().min(2).max(32).parse(str(fd, "display_name")),
    contact: opt(fd, "contact"), parent_name: opt(fd, "parent_name"), parent_contact: opt(fd, "parent_contact"),
    title: opt(fd, "title"),
  }).eq("id", id);
  revalidatePath(`/tutor/students/${id}`);
}

export async function addNote(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  const body = z.string().min(1).max(4000).parse(str(fd, "body"));
  await createAdminClient().from("tutor_notes").insert({ student_id: id, body });
  revalidatePath(`/tutor/students/${id}`);
}

export async function deleteNote(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  await createAdminClient().from("tutor_notes").delete().eq("id", id);
  revalidatePath(`/tutor/students/${str(fd, "student")}`);
}

export async function setTopicLabel(student: string, chapter: string, label: "weak" | "average" | "strong" | "none") {
  await requireTutor();
  uuid.parse(student); uuid.parse(chapter);
  const admin = createAdminClient();
  if (label === "none") await admin.from("student_topics").delete().eq("student_id", student).eq("chapter_id", chapter);
  else await admin.from("student_topics").upsert({ student_id: student, chapter_id: chapter, label: z.enum(["weak", "average", "strong"]).parse(label) });
  revalidatePath(`/tutor/students/${student}`);
}

export async function awardBonus(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  const xp = z.number().int().min(0).max(2000).parse(num(fd, "xp"));
  const coins = z.number().int().min(0).max(500).parse(num(fd, "coins"));
  const reason = z.string().min(2).max(120).parse(str(fd, "reason"));
  const sb = await createClient();
  const { error } = await sb.rpc("tutor_award", { p_user: id, p_xp: xp, p_coins: coins, p_reason: reason });
  if (error) await fail(error.message);
  revalidatePath(`/tutor/students/${id}`);
}

// ---------------------------------------------------------------- parent reports
const rating = (pct: number | null) =>
  pct === null ? "Not assessed" : pct >= 80 ? "Excellent" : pct >= 65 ? "Good" : pct >= 50 ? "Satisfactory" : "Needs improvement";
const pctOf = (s: number, t: number) => (t ? Math.round((100 * s) / t) : null);
const muDate = (iso: string) => new Date(new Date(iso).getTime() + 4 * 3600_000).toISOString().slice(0, 10);

/** Builds a parent-friendly snapshot (no XP / levels) and saves it as a report. */
export async function createReport(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  const period = z.string().min(2).max(60).parse(str(fd, "period"));
  const comment = z.string().min(1).max(4000).parse(str(fd, "comment"));
  const days = z.number().int().min(7).max(365).parse(num(fd, "days", 30));
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const admin = createAdminClient();
  const [{ data: p }, { data: att }, { data: q }, { data: subs }, { data: set }, { data: act }, { data: topics }] = await Promise.all([
    admin.from("profiles").select("display_name, parent_name, tier").eq("id", id).single(),
    admin.from("attendance").select("status, session:class_sessions!inner(held_on)").eq("user_id", id).gte("session.held_on", since.slice(0, 10)),
    admin.from("quiz_attempts").select("score, total, quiz:quizzes(course:courses(title, sort))").eq("user_id", id).not("finished_at", "is", null).gte("started_at", since),
    admin.from("submissions").select("score, graded_at, submitted_at, assignment:assignments(max_score, due_at, course:courses(title))").eq("user_id", id).gte("submitted_at", since),
    admin.from("assignments").select("id").eq("status", "published").gte("created_at", since),
    admin.from("xp_events").select("created_at").eq("user_id", id).gte("created_at", since),
    admin.from("student_topics").select("label, chapter:chapters(number, title, sort, course:courses(title, sort))").eq("student_id", id),
  ]);
  if (!p) await fail("Student not found");

  const a = att || [];
  const count = (k: string) => a.filter((r) => r.status === k).length;
  const attended = count("present") + count("late");

  type Subj = { subject: string; sort: number; qs: number; qt: number; quizzes: number; hs: number; hn: number };
  const subj: Record<string, Subj> = {};
  const get = (name: string, sort = 99) => (subj[name] ??= { subject: name, sort, qs: 0, qt: 0, quizzes: 0, hs: 0, hn: 0 });
  for (const r of q || []) {
    const c = (r.quiz as unknown as { course: { title: string; sort: number } | null })?.course;
    const s = get(c?.title || "Other", c?.sort);
    s.qs += r.score ?? 0; s.qt += r.total ?? 0; s.quizzes++;
  }
  let hwSum = 0, hwN = 0, onTime = 0;
  for (const r of subs || []) {
    const as = r.assignment as unknown as { max_score: number; due_at: string | null; course: { title: string } | null };
    if (!as?.due_at || r.submitted_at <= as.due_at) onTime++;
    if (r.graded_at && as?.max_score) {
      const frac = (r.score ?? 0) / as.max_score;
      hwSum += frac; hwN++;
      const s = get(as.course?.title || "Other"); s.hs += frac; s.hn++;
    }
  }
  const subjects = Object.values(subj).sort((x, y) => x.sort - y.sort).map((s) => {
    const quiz = pctOf(s.qs, s.qt);
    const hw = s.hn ? Math.round((100 * s.hs) / s.hn) : null;
    const overall = quiz !== null && hw !== null ? Math.round((quiz + hw) / 2) : quiz ?? hw;
    return { subject: s.subject, quizzes: s.quizzes, quiz_pct: quiz, homework_pct: hw, rating: rating(overall) };
  });

  type T = { label: string; chapter: { number: string; title: string; sort: number; course: { title: string; sort: number } } | null };
  const byCourse: Record<string, { subject: string; sort: number; strong: string[]; average: string[]; weak: string[] }> = {};
  for (const t of ((topics as unknown as T[]) || []).filter((t) => t.chapter).sort((x, y) => x.chapter!.sort - y.chapter!.sort)) {
    const c = t.chapter!;
    const g = (byCourse[c.course.title] ??= { subject: c.course.title, sort: c.course.sort, strong: [], average: [], weak: [] });
    g[t.label as "strong" | "average" | "weak"]?.push(`${c.number}. ${c.title}`);
  }

  const allQs = (q || []).reduce((s, r) => s + (r.score ?? 0), 0), allQt = (q || []).reduce((s, r) => s + (r.total ?? 0), 0);
  const stats = {
    version: 2, student: p!.display_name, tier: p!.tier, days,
    attendance: { sessions: a.length, present: count("present"), late: count("late"), absent: count("absent"), excused: count("excused"), pct: pctOf(attended, a.length) },
    quizzes: { count: (q || []).length, avg_pct: pctOf(allQs, allQt) },
    homework: { set: (set || []).length, handed_in: (subs || []).length, on_time: onTime, avg_pct: hwN ? Math.round((100 * hwSum) / hwN) : null },
    study_days: new Set((act || []).map((e) => muDate(e.created_at))).size,
    subjects,
    topics: Object.values(byCourse).sort((x, y) => x.sort - y.sort).map(({ sort: _s, ...g }) => g),
  };
  const { data: rep, error } = await admin.from("reports").insert({
    student_id: id, period_label: period, parent_name: opt(fd, "parent_name") || p!.parent_name, comment, stats,
    shared_with_student: fd.get("share") === "on",
  }).select("id").single();
  if (error) await fail(error.message);
  redirect(`/reports/${rep!.id}`);
}

export async function toggleReportShare(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  const share = str(fd, "share") === "1";
  const admin = createAdminClient();
  const { data: r } = await admin.from("reports").update({ shared_with_student: share }).eq("id", id).select("student_id, period_label").single();
  if (share && r) await admin.from("notifications").insert({ user_id: r.student_id, title: `Your ${r.period_label} report is ready`, link: `/reports/${id}` });
  revalidatePath(`/reports/${id}`);
}

// ---------------------------------------------------------------- content
export async function setStatus(fd: FormData) {
  await requireTutor();
  const table = z.enum(["chapters", "parts", "quizzes", "resources", "assignments"]).parse(str(fd, "table"));
  const id = uuid.parse(str(fd, "id"));
  const status = pub.parse(str(fd, "status"));
  const release_at = status === "scheduled" ? mu(opt(fd, "release_at")) : null;
  if (status === "scheduled" && !release_at) await fail("Pick a release date for scheduled items");
  await createAdminClient().from(table).update({ status, release_at }).eq("id", id);
  revalidatePath("/tutor/content", "layout");
  revalidatePath("/tutor/exams");
}

export async function savePart(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  const video = opt(fd, "video_url");
  if (video && !/^https:\/\//.test(video)) await fail("Video link must start with https://");
  await createAdminClient().from("parts").update({ title: z.string().min(1).max(160).parse(str(fd, "title")), body: str(fd, "body") || null, video_url: video }).eq("id", id);
  revalidatePath("/tutor/content", "layout");
}

export async function addPart(fd: FormData) {
  await requireTutor();
  const chapter = uuid.parse(str(fd, "chapter"));
  const admin = createAdminClient();
  const { count } = await admin.from("parts").select("id", { count: "exact", head: true }).eq("chapter_id", chapter);
  await admin.from("parts").insert({ chapter_id: chapter, number: str(fd, "number") || String((count || 0) + 1), title: z.string().min(1).max(160).parse(str(fd, "title")), sort: (count || 0) + 1, status: "draft" });
  revalidatePath("/tutor/content", "layout");
}

export async function addResource(input: { course: string; chapter: string | null; section: "library" | "class"; title: string; kind: string; file_path?: string | null; url?: string | null }) {
  await requireTutor();
  const r = z.object({
    course: uuid, chapter: uuid.nullable(), section: z.enum(["library", "class"]), title: z.string().min(1).max(160),
    kind: z.enum(["pdf", "video", "worksheet", "link", "image", "other"]),
    file_path: z.string().max(300).nullable().optional(), url: z.string().url().startsWith("https://").nullable().optional(),
  }).parse(input);
  if (!r.file_path && !r.url) await fail("Add a file or a link");
  await createAdminClient().from("resources").insert({ course_id: r.course, chapter_id: r.chapter, section: r.section, title: r.title, kind: r.kind, file_path: r.file_path || null, url: r.url || null });
  revalidatePath("/tutor/content", "layout");
}

export async function deleteResource(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  const admin = createAdminClient();
  const { data } = await admin.from("resources").delete().eq("id", id).select("file_path").single();
  if (data?.file_path) await admin.storage.from("resources").remove([data.file_path]);
  revalidatePath("/tutor/content", "layout");
}

export async function addQuestion(fd: FormData) {
  await requireTutor();
  const quiz = uuid.parse(str(fd, "quiz"));
  const options = [0, 1, 2, 3].map((i) => str(fd, `o${i}`)).filter(Boolean);
  if (options.length < 2) await fail("Give at least 2 options");
  const correct = z.number().int().min(0).max(options.length - 1).parse(num(fd, "correct"));
  const admin = createAdminClient();
  const { data: qz } = await admin.from("quizzes").select("course_id, chapter_id").eq("id", quiz).single();
  if (!qz) await fail("Quiz not found");
  const { data: q, error } = await admin.from("questions").insert({
    course_id: qz!.course_id, chapter_id: qz!.chapter_id, quiz_id: quiz,
    prompt: z.string().min(3).max(1000).parse(str(fd, "prompt")), options, explanation: opt(fd, "explanation"),
  }).select("id").single();
  if (error) await fail(error.message);
  await admin.from("question_keys").insert({ question_id: q!.id, correct });
  revalidatePath("/tutor/content", "layout");
}

export async function updateQuestion(fd: FormData) {
  await requireTutor();
  const id = uuid.parse(str(fd, "id"));
  const options = [0, 1, 2, 3].map((i) => str(fd, `o${i}`)).filter(Boolean);
  if (options.length < 2) await fail("Give at least 2 options");
  const correct = z.number().int().min(0).max(options.length - 1).parse(num(fd, "correct"));
  const admin = createAdminClient();
  const { error } = await admin.from("questions").update({
    prompt: z.string().min(3).max(1000).parse(str(fd, "prompt")), options, explanation: opt(fd, "explanation"),
    battle_ok: fd.get("battle_ok") === "on",
  }).eq("id", id);
  if (error) await fail(error.message);
  await admin.from("question_keys").upsert({ question_id: id, correct });
  revalidatePath("/tutor/content", "layout");
}

export async function deleteQuestion(fd: FormData) {
  await requireTutor();
  await createAdminClient().from("questions").delete().eq("id", uuid.parse(str(fd, "id")));
  revalidatePath("/tutor/content", "layout");
}

// ---------------------------------------------------------------- homework
export async function createAssignment(input: Record<string, string | null>) {
  await requireTutor();
  const a = z.object({
    course: uuid, chapter: uuid.nullable(), title: z.string().min(2).max(160), kind: z.enum(["homework", "worksheet", "mock", "paper"]),
    instructions: z.string().max(4000).nullable(), due: z.string().nullable(), max_score: z.coerce.number().int().min(1).max(500),
    xp_reward: z.coerce.number().int().min(0).max(1000), file_path: z.string().max(300).nullable(),
  }).parse(input);
  const admin = createAdminClient();
  const { data, error } = await admin.from("assignments").insert({
    course_id: a.course, chapter_id: a.chapter, title: a.title, kind: a.kind, instructions: a.instructions,
    due_at: mu(a.due), max_score: a.max_score, xp_reward: a.xp_reward, file_path: a.file_path,
  }).select("id").single();
  if (error) await fail(error.message);
  const { data: studs } = await admin.from("profiles").select("id").eq("status", "approved").eq("role", "student");
  if (studs?.length) await admin.from("notifications").insert(studs.map((s) => ({ user_id: s.id, title: `New ${a.kind}: ${a.title}`, link: `/homework#${data!.id}` })));
  await postToDiscord("", [{ title: `📚 New ${a.kind}: ${a.title}`, description: a.due ? `Due ${a.due.replace("T", " ")}` : "No deadline", color: 0x1cb0f6, url: siteUrl() + "/homework" }]);
  revalidatePath("/tutor/homework");
}

export async function grade(fd: FormData) {
  await requireTutor();
  const sb = await createClient();
  const { error } = await sb.rpc("grade_submission", { p_submission: uuid.parse(str(fd, "id")), p_score: z.number().int().min(0).max(500).parse(num(fd, "score")), p_feedback: opt(fd, "feedback") });
  if (error) await fail(error.message);
  revalidatePath("/tutor/homework");
}

export async function releaseAnswers(input: { id: string; solution_path: string | null; mark_scheme_path: string | null; video: string | null; release: boolean }) {
  await requireTutor();
  const id = uuid.parse(input.id);
  const patch: Record<string, unknown> = { answers_released: input.release };
  if (input.solution_path) patch.solution_path = input.solution_path;
  if (input.mark_scheme_path) patch.mark_scheme_path = input.mark_scheme_path;
  if (input.video !== null) patch.solution_video_url = input.video && /^https:\/\//.test(input.video) ? input.video : null;
  const admin = createAdminClient();
  const { data: a } = await admin.from("assignments").update(patch).eq("id", id).select("title").single();
  if (input.release && a) {
    const { data: subs } = await admin.from("submissions").select("user_id").eq("assignment_id", id);
    if (subs?.length) await admin.from("notifications").insert(subs.map((s) => ({ user_id: s.user_id, title: `Answers out: ${a.title}`, link: `/homework#${id}` })));
  }
  revalidatePath("/tutor/homework");
}

export async function deleteAssignment(fd: FormData) {
  await requireTutor();
  await createAdminClient().from("assignments").delete().eq("id", uuid.parse(str(fd, "id")));
  revalidatePath("/tutor/homework");
}

// ---------------------------------------------------------------- attendance
export async function createSession(fd: FormData) {
  await requireTutor();
  const course = opt(fd, "course");
  await createAdminClient().from("class_sessions").insert({
    course_id: course ? uuid.parse(course) : null, title: z.string().min(2).max(120).parse(str(fd, "title")),
    held_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(str(fd, "held_on")),
  });
  revalidatePath("/tutor/attendance");
}

export async function mark(session: string, user: string, status: "present" | "late" | "absent" | "excused") {
  await requireTutor();
  const sb = await createClient();
  const { error } = await sb.rpc("mark_attendance", { p_session: uuid.parse(session), p_user: uuid.parse(user), p_status: status });
  if (error) await fail(error.message);
  revalidatePath("/tutor/attendance");
}

// ---------------------------------------------------------------- announcements & challenges
export async function announce(fd: FormData) {
  await requireTutor();
  const title = z.string().min(2).max(140).parse(str(fd, "title"));
  const body = z.string().min(1).max(3000).parse(str(fd, "body"));
  const admin = createAdminClient();
  await admin.from("announcements").insert({ title, body });
  const { data: studs } = await admin.from("profiles").select("id").eq("status", "approved");
  if (studs?.length) await admin.from("notifications").insert(studs.map((s) => ({ user_id: s.id, title: `📣 ${title}`, body: body.slice(0, 140), link: "/dashboard" })));
  if (fd.get("discord") === "on") await postToDiscord("", [{ title: `📣 ${title}`, description: body.slice(0, 3900), color: 0xffc800, url: siteUrl() + "/dashboard" }], "announce");
  revalidatePath("/tutor/announcements");
}

export async function deleteAnnouncement(fd: FormData) {
  await requireTutor();
  await createAdminClient().from("announcements").delete().eq("id", uuid.parse(str(fd, "id")));
  revalidatePath("/tutor/announcements");
}

export async function saveChallenge(fd: FormData) {
  await requireTutor();
  const c = {
    title: z.string().min(2).max(100).parse(str(fd, "title")), description: opt(fd, "description"),
    period: z.enum(["daily", "weekly", "once"]).parse(str(fd, "period")),
    type: z.enum(["quiz_pass", "quiz_specific", "study_days", "homework_on_time", "attendance", "battle_win", "battle_play", "xp_earned"]).parse(str(fd, "type")),
    target: z.number().int().min(1).max(10000).parse(num(fd, "target", 1)),
    xp_reward: z.number().int().min(0).max(2000).parse(num(fd, "xp_reward", 100)),
    coin_reward: z.number().int().min(0).max(500).parse(num(fd, "coin_reward", 10)),
    quiz_id: opt(fd, "quiz_id"), starts_on: opt(fd, "starts_on"), ends_on: opt(fd, "ends_on"),
  };
  if (c.quiz_id) uuid.parse(c.quiz_id);
  await createAdminClient().from("challenges").insert(c);
  revalidatePath("/tutor/challenges");
}

export async function toggleChallenge(fd: FormData) {
  await requireTutor();
  await createAdminClient().from("challenges").update({ active: str(fd, "active") === "1" }).eq("id", uuid.parse(str(fd, "id")));
  revalidatePath("/tutor/challenges");
}

// ---------------------------------------------------------------- shop
export async function updateShopItem(fd: FormData) {
  await requireTutor();
  await createAdminClient().from("shop_items").update({
    price: z.number().int().min(0).max(100000).parse(num(fd, "price")),
    min_level: z.number().int().min(1).max(100).parse(num(fd, "min_level", 1)),
    active: fd.get("active") === "on",
  }).eq("id", uuid.parse(str(fd, "id")));
  revalidatePath("/tutor/shop");
}

// ---------------------------------------------------------------- exams
export async function createExam(fd: FormData) {
  await requireTutor();
  const course = uuid.parse(str(fd, "course"));
  const opens = mu(opt(fd, "opens_at"));
  const closes = mu(opt(fd, "closes_at"));
  if (opens && closes && closes <= opens) await fail("The closing time must be after the opening time");
  const minutes = z.number().int().min(5).max(240).parse(num(fd, "minutes", 60));
  const count = z.number().int().min(5).max(80).parse(num(fd, "count", 40));
  const attempts = num(fd, "attempts", 1);
  const status = fd.get("draft") === "on" ? "draft" : opens && opens > new Date().toISOString() ? "scheduled" : "published";
  const admin = createAdminClient();
  const { error } = await admin.from("quizzes").insert({
    course_id: course, chapter_id: null, kind: "exam", title: z.string().min(3).max(120).parse(str(fd, "title")),
    question_count: count, time_limit_sec: minutes * 60, xp_reward: z.number().int().min(0).max(2000).parse(num(fd, "xp", 200)),
    status, release_at: status === "scheduled" ? opens : null, closes_at: closes, max_attempts: attempts > 0 ? attempts : null, sort: 900,
  });
  if (error) await fail(error.message);
  if (status !== "draft") {
    const { data: c } = await admin.from("courses").select("title, tier").eq("id", course).single();
    const { data: studs } = await admin.from("profiles").select("id").eq("status", "approved").eq("role", "student").eq("tier", c?.tier || "O");
    const when = status === "scheduled" ? `Opens ${str(fd, "opens_at").replace("T", " ")}` : "Open now";
    if (studs?.length) await admin.from("notifications").insert(studs.map((s) => ({ user_id: s.id, title: `📝 New exam: ${str(fd, "title")}`, body: `${c?.title} · ${when}`, link: "/practice" })));
    await postToDiscord("", [{ title: `📝 New exam: ${str(fd, "title")}`, description: `${c?.title} · ${count} questions · ${minutes} min · ${when}${closes ? ` · closes ${str(fd, "closes_at").replace("T", " ")}` : ""}`, color: 0xa855f7, url: siteUrl() + "/practice" }]);
  }
  revalidatePath("/tutor/exams");
}

export async function updateExam(fd: FormData) {
  await requireTutor();
  const attempts = num(fd, "attempts", 0);
  await createAdminClient().from("quizzes").update({
    closes_at: mu(opt(fd, "closes_at")),
    max_attempts: attempts > 0 ? attempts : null,
    time_limit_sec: z.number().int().min(5).max(240).parse(num(fd, "minutes", 60)) * 60,
    question_count: z.number().int().min(5).max(80).parse(num(fd, "count", 40)),
  }).eq("id", uuid.parse(str(fd, "id"))).eq("kind", "exam");
  revalidatePath("/tutor/exams");
}

export async function deleteExam(fd: FormData) {
  await requireTutor();
  await createAdminClient().from("quizzes").delete().eq("id", uuid.parse(str(fd, "id"))).eq("kind", "exam");
  revalidatePath("/tutor/exams");
}
