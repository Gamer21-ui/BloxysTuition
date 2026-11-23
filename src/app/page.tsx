import Link from "next/link";
import { BookOpen, Flame, Swords, Trophy } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { BlockyAvatar } from "@/components/blocky-avatar";
import { getProfile } from "@/lib/auth";

const FEATURES = [
  { icon: BookOpen, title: "Every chapter, unlocked as we go", text: "Notes, worksheets and quizzes for O Level Accounting, Business, Economics and Computer Science, following the Cambridge syllabus." },
  { icon: Flame, title: "XP, streaks and levels", text: "Earn XP for classes, homework and quizzes. Keep your streak alive and climb from Noob to Mythic." },
  { icon: Swords, title: "Live quiz battles", text: "1v1 or 2v2. Answer fast, watch each round get revealed, and take the win." },
  { icon: Trophy, title: "Achievements and leaderboards", text: "Unlock badges, flex your rank, and get rewarded for actually putting the work in." },
];

const faq = [
  { q: "Who is this for?", a: "Students in FunnyBloxy's tuition classes: O Level for now, with AS and A Level coming." },
  { q: "How do I get an account?", a: "Sign in with Discord, then your tutor approves you. Until then you'll see a waiting screen." },
  { q: "Can I install it like an app?", a: "Yes. Open the site in Chrome or Safari and choose 'Add to Home screen' or 'Install app'." },
];

export default async function Landing() {
  const me = await getProfile();
  const invite = process.env.NEXT_PUBLIC_DISCORD_INVITE;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "EducationalOrganization", name: BRAND.name, description: BRAND.description, areaServed: BRAND.location },
      { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
  return (
    <div className="min-h-dvh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <span className="font-display text-2xl text-primary">{BRAND.short}</span>
        <Link href={me ? "/dashboard" : "/login"} className="btn btn-primary">{me ? "Open app" : "Sign in"}</Link>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[1.2fr_1fr] md:py-16">
        <div>
          <span className="chip text-accent">O Level · Mauritius · Nov 2027 exams</span>
          <h1 className="mt-4 text-5xl leading-[1.05] md:text-6xl">{BRAND.name}</h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{BRAND.tagline} Lessons, quizzes and homework from your tutor, turned into a game you actually want to open.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={me ? "/dashboard" : "/login"} className="btn btn-primary text-lg">{me ? "Continue" : "Start playing"}</Link>
            {invite && (
              <a href={invite} target="_blank" rel="noopener noreferrer" className="btn btn-accent text-lg">Join our Discord</a>
            )}
          </div>
        </div>
        <div className="relative mx-auto">
          <div className="card grid grid-cols-3 gap-3 p-5">
            {[
              { bg: "#58cc02", shirt: "#1cb0f6", hat: "crown", face: "cool" },
              { bg: "#1cb0f6", shirt: "#ff4b4b", hat: "headphones", face: "grin" },
              { bg: "#ffc800", shirt: "#a855f7", hat: "cap", face: "wink" },
              { bg: "#a855f7", shirt: "#58cc02", hat: "tophat", face: "smile" },
              { bg: "#ff4b4b", shirt: "#ffc800", hat: "viking", face: "focused" },
              { bg: "#0ea5e9", shirt: "#f97316", hat: "halo", face: "smile" },
            ].map((c, i) => (
              <div key={i} className="overflow-hidden border-2 border-line" style={{ borderRadius: "calc(var(--radius) * 0.7)" }}>
                <BlockyAvatar size={96} config={c as never} />
              </div>
            ))}
          </div>
          <div className="card absolute -bottom-5 -left-6 flex items-center gap-2 px-3 py-2 text-sm font-bold"><Flame className="text-warn" size={18} /> 12 day streak</div>
          <div className="card absolute -right-4 -top-4 px-3 py-2 text-sm font-bold text-primary">+60 XP</div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <f.icon className="text-primary" size={28} aria-hidden="true" />
              <h2 className="mt-3 text-xl">{f.title}</h2>
              <p className="mt-2 text-sm text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-10">
        <h2 className="mb-4 text-3xl">FAQ</h2>
        <div className="space-y-3">
          {faq.map((f) => (
            <details key={f.q} className="card">
              <summary className="cursor-pointer font-display text-lg">{f.q}</summary>
              <p className="mt-2 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-muted">© {new Date().getFullYear()} {BRAND.name} · {BRAND.location}</footer>
    </div>
  );
}
