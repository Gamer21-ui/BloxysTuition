import "server-only";
/**
 * 🕶️ Mr. Shades: the Black Market seller's personality, mood and what he knows about the student.
 * Used for his greeting (free, no AI) and to brief the AI before each haggle.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { levelFromXp } from "@/lib/xp";

export const PERSONA = `You are "Mr. Shades", the Black Market seller. Backstory: once the top student on this site, he "retired" into the shadows after one pop quiz too many. Now he lurks behind the shop in a fedora and trench coat. He LOVES his fedora (compliments work), hates pop quizzes, calls everyone "kid", talks like a 1940s noir detective, is dramatic and secretly soft on students who actually study (he respects the grind). He is scared of "the owner" (the tutor).`;

export type Mood = { key: string; name: string; emoji: string; style: string; bonus: number; hello: string[] };
const MOODS: Mood[] = [
  { key: "grumpy", name: "Grumpy", emoji: "😤", bonus: -8, style: "grumpy and short-tempered today; harder to impress", hello: ["What. Make it quick, kid.", "Bad day. Somebody stepped on my fedora."] },
  { key: "generous", name: "Generous", emoji: "🤑", bonus: 8, style: "in a rare generous mood; a little easier to talk down", hello: ["Business is booming. I'm feeling… charitable.", "Ah, a customer! Today might be your lucky day."] },
  { key: "dramatic", name: "Dramatic", emoji: "🎭", bonus: 0, style: "extra theatrical and dramatic, everything is a movie scene", hello: ["*steps out of the shadows* …You found me.", "The rain falls. The coins jingle. And YOU walk in."] },
  { key: "sleepy", name: "Sleepy", emoji: "😴", bonus: 3, style: "sleepy and yawning, a bit slow, slightly easier because he can't be bothered", hello: ["*yawn* …it's late, kid. What do you want?", "Mmh? Oh. A customer. At this hour."] },
  { key: "suspicious", name: "Suspicious", emoji: "🧐", bonus: -4, style: "suspicious of everyone, asks who sent them", hello: ["Who sent you? …Fine. Talk.", "You've got a trustworthy face. Too trustworthy."] },
  { key: "nostalgic", name: "Nostalgic", emoji: "🎞️", bonus: 4, style: "nostalgic, keeps mentioning his glory days as the top student", hello: ["Back in my day I was #1 on that board, you know.", "Ah… you remind me of me. Before the pop quizzes."] },
];
const PARANOID: Mood = { key: "paranoid", name: "Paranoid", emoji: "😰", bonus: 0, style: "PARANOID because the owner is online right now; whispers, keeps looking over his shoulder, and honestly advises the student NOT to buy right now (50% chance the owner sees the deal)", hello: ["Psst! The OWNER is online. I'd wait if I were you, kid. 50/50 they see it.", "Not now, not now… the owner's around. Come back later. Trust me."] };

/** Mood of the day (same for everyone on a given day), overridden when the owner is online or it's late. */
export function moodFor(ownerOnline: boolean, now = new Date()) {
  if (ownerOnline) return PARANOID;
  const mu = new Date(now.getTime() + 4 * 3600_000);
  const h = mu.getUTCHours();
  if (h >= 23 || h < 5) return MOODS.find((m) => m.key === "sleepy")!;
  const day = Math.floor(mu.getTime() / 86_400_000);
  const pool = MOODS.filter((m) => m.key !== "sleepy");
  return pool[(day * 7 + 3) % pool.length];
}

export type Intel = {
  rank: number | null; players: number; level: number; streak: number; studiedRecently: boolean; idleWeek: boolean;
  ownerOnline: boolean; cap: number; capReason: string | null; mood: Mood;
  visitsWeek: number; overdue: number; tax: number; grudge: boolean;
};
export type Visit = { week: number; overdue: number; tax: number; grudge?: boolean } | null;

/** What Mr. Shades knows about this student (server-side only). */
export async function intelFor(userId: string, visit: Visit = null): Promise<Intel> {
  const admin = createAdminClient();
  const since3 = new Date(Date.now() - 3 * 86_400_000).toISOString();
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [{ data: studs }, { data: me }, { data: tutor }, { count: q3 }, { count: h3 }, { count: q7 }, { count: h7 }] = await Promise.all([
    admin.from("profiles").select("id, xp, lifetime_xp").eq("role", "student").eq("status", "approved"),
    admin.from("profiles").select("xp, streak").eq("id", userId).maybeSingle(),
    admin.from("profiles").select("id").eq("role", "tutor").gte("last_seen_at", new Date(Date.now() - 3 * 60_000).toISOString()).limit(1),
    admin.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("finished_at", since3),
    admin.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("submitted_at", since3),
    admin.from("quiz_attempts").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("finished_at", since7),
    admin.from("submissions").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("submitted_at", since7),
  ]);
  const total = (p: { xp: number; lifetime_xp?: number | null }) => (p.lifetime_xp ?? 0) + p.xp;
  const sorted = (studs || []).slice().sort((a, b) => total(b) - total(a));
  const idx = sorted.findIndex((p) => p.id === userId);
  const rank = idx >= 0 ? idx + 1 : null;
  const ownerOnline = !!tutor?.length;
  const cap = rank === 1 ? 15 : rank !== null && rank <= 3 ? 25 : 50;
  const capReason = rank === 1 ? "you're #1 on the leaderboard" : rank !== null && rank <= 3 ? `you're #${rank} on the leaderboard` : null;
  const xp = me?.xp ?? 0;
  return {
    rank, players: sorted.length, level: levelFromXp(xp), streak: me?.streak ?? 0,
    studiedRecently: (q3 || 0) + (h3 || 0) > 0 || (me?.streak ?? 0) >= 5, idleWeek: (q7 || 0) + (h7 || 0) === 0 && (me?.streak ?? 0) === 0,
    ownerOnline, cap, capReason, mood: moodFor(ownerOnline),
    ...(visit ? { visitsWeek: visit.week, overdue: visit.overdue, tax: visit.tax, grudge: !!visit.grudge } : await visitInfo(userId)),
  };
}

/** visits this week / overdue homework / loiterer tax, straight from the database helpers */
async function visitInfo(userId: string) {
  const admin = createAdminClient();
  const [{ data: w }, { data: o }, { data: t }, { data: g }] = await Promise.all([
    admin.rpc("bm_week_visits", { p_user: userId }), admin.rpc("overdue_homework", { p_user: userId }), admin.rpc("bm_tax", { p_user: userId }),
    admin.rpc("bm_grudge", { p_user: userId }),
  ]);
  return { visitsWeek: (w as number) ?? 0, overdue: (o as number) ?? 0, tax: (t as number) ?? 0, grudge: !!g };
}

/** Free greeting built from mood + what he knows (no AI call). */
export function greeting(i: Intel, name: string) {
  const first = name.split(" ")[0];
  const seed = new Date().getUTCDate() + first.length;
  const lines = [i.mood.hello[seed % i.mood.hello.length]];
  if (i.ownerOnline) return lines[0];
  if (i.grudge) return `YOU. ${first}. Hand in my vault, hand on my heart… I trusted you. Prices are 50% more for you until I hear a REAL apology.`;
  const hw = `${i.overdue} overdue homework${i.overdue === 1 ? "" : "s"}`;
  if (i.tax > 0) return `${lines[0]} ${first}. Visit #${i.visitsWeek} this week and ${hw}? You LIVE here now. Alright: for you, 10% more. Do your homework and maybe I'll forget.`;
  if (i.overdue > 0 && i.visitsWeek >= 4) return `${lines[0]} Back AGAIN, ${first}? ${hw} and you're in MY alley? Go do it. Keep loitering and prices go up.`;
  if (i.overdue > 0) lines.push(`Psst… ${hw}, ${first}. I can smell it from here.`);
  else if (i.rank === 1) lines.push(`Well, well. ${first}, #1 on the board. Big shot. Don't expect big discounts.`);
  if (!i.overdue && i.rank && i.rank > 1 && i.rank <= 3) lines.push(`#${i.rank} on the leaderboard, huh ${first}? Fancy.`);
  else if (!i.overdue && i.idleWeek) lines.push(`No quizzes, no homework all week, ${first}? Go study, then come see me.`);
  else if (!i.overdue && i.studiedRecently && !(i.rank && i.rank <= 3)) lines.push(`I hear you've been grinding, ${first}. Respect.`);
  return lines.join(" ");
}

/** Briefing added to the AI's instructions for this student. */
export function briefing(i: Intel) {
  return [
    `Today's mood: ${i.mood.name} (${i.mood.style}).`,
    i.ownerOnline ? "The OWNER IS ONLINE right now: warn the student and recommend they wait before buying." : "The owner is offline right now.",
    i.rank ? `This student is #${i.rank} of ${i.players} on the leaderboard (level ${i.level}).` : "",
    i.cap < 50 ? `Because ${i.capReason}, the best you will EVER give them is ${i.cap}% off. Tease them about being a big shot; tell them your ceiling if they push.` : "Great haggling could get up to 50% off.",
    i.studiedRecently ? `They've been studying lately (streak ${i.streak}). You respect that: be a bit warmer.` : "",
    i.idleWeek ? "They haven't done any quizzes or homework this week: roast them a little and tell them to go study (still haggle)." : "",
    i.overdue > 0 ? `They have ${i.overdue} OVERDUE homework${i.overdue === 1 ? "" : "s"}: roast them about it and tell them to go do it.` : "",
    i.visitsWeek >= 4 ? `They've visited your alley ${i.visitsWeek} times this week${i.overdue ? " instead of doing homework" : ""}; comment on it.` : "",
    i.grudge ? "This student tried to ROB your vault and got caught. You're hurt and holding a grudge: their prices are 50% higher until they properly apologise (in the apology box, not here). Be cold and dramatic, and make them work hard for any discount." : "",
    i.tax > 0 ? "Because they loiter here with overdue homework, you charge them 10% MORE (the loiterer tax); tell them it goes away if they do their homework." : "",
  ].filter(Boolean).join(" ");
}
