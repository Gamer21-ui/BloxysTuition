# FunnyBloxy's Academic Comeback! 🧱📚

A small, gamified tuition platform for O Level **Accounting (7707), Business (7081), Economics (2281) and Computer Science (2210)**, built for a handful of students sitting the **November 2027** exams. AS/A Level comes later.

Think Google Classroom + Duolingo + a pinch of Roblox: lessons, quizzes, XP, levels, streaks, daily and weekly quests, badges, leaderboards and live **1v1 / 2v2 quiz battles**. Chat stays on Discord.

## What's in release 1

| Students | Tutor |
|---|---|
| Discord sign-in (tutor approves each account) | Approve / suspend students, set their level (O/AS/A) |
| 3 themes: **Bloxy**, **Dark Gamer**, **Retro** | Overview charts: engagement, scores, weak chapters, attendance, retention |
| Avatar: Roblox headshot, built-in blocky avatar (hats unlock by level), or both | Private notes per student (students can never read them) |
| Courses → chapters → parts, plus **Library** and **Class notes** files | Mark chapters, parts, quizzes and files as draft / locked / scheduled / published |
| Chapter quizzes (15 questions each), course speedruns, full answer review |
| **Exam prep:** timed Paper 1 practice (Accounting 40 Q / 1h30, Economics 40 Q / 1h), mixed tests for Business & CS, score history | Edit any question, answer and explanation in the app |
| **Mistakes deck:** wrong answers come back after 1, 3 and 7 days until mastered | See each student's mistakes count | Edit lesson notes (Markdown), upload files, add quiz questions |
| XP, levels, ranks, streaks, coins, 15 badges, quests | Set homework, mark it, release worked solutions / mark schemes |
| +0.25× XP per level studied above your own (O→AS 1.25×, O→A 1.5×) | Attendance (40 XP present, 20 late) |
| Live quiz battles with round-by-round reveals | Bonus XP / coins with a reason |
| Homework hand-in (photos, PDFs, Word…) with feedback | Announcements (in-app + Discord) and custom challenges |
| Leaderboards: all-time, monthly, speedrun, battles, attendance | **Parent progress reports** in plain language (print / save as PDF) |
| Installable app (PWA) with offline page | Discord webhook posts: level-ups, battle results, new homework |

**Not yet (later phases):** coin shop and cosmetics, Discord role bot, AS/A Level courses, push notifications.

## Tech

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Supabase (Postgres, Auth with Discord, Storage, Realtime) · Vercel. Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/SCHEMA.md](docs/SCHEMA.md).

## Getting it online

Follow **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** step by step. It assumes you only have a GitHub account. About 30–45 minutes.

## Running it on your computer

```bash
npm install
cp .env.example .env.local   # fill in your Supabase + Discord values
npm run dev                  # http://localhost:3000
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript check |
| `npm run build` | Production build |
| `npm run seed:sql` | Rebuild `supabase/seed.sql` from `scripts/seed-data.mjs` (courses, chapters, starter quizzes) |
| `npm run sql:bundle` | Rebuild `supabase/setup.sql` = all migrations + seed in one file |

Database tests (needs a local Postgres 16): `PGHOST=… PGPORT=… PGUSER=postgres supabase/tests/run.sh`

## Editing course content

* **Small edits** (fix a note, add a question, upload a PDF): do it in the app under **Tutor → Content**.
* **Bulk edits** (rewrite starter quizzes): edit `scripts/seed-data.mjs`, run `npm run seed:sql`, then run the new `supabase/seed.sql` in the Supabase SQL editor. It's safe to re-run: it only adds rows that don't exist yet and never overwrites anything you edited in the app.

## Renaming

Change `BRAND` in `src/lib/brand.ts` and the name in `public/manifest.webmanifest`.
