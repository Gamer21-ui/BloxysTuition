# Security of FunnyBloxy

*A one-page write-up of how this app keeps students honest and their data safe — and what a security review of it found.*

FunnyBloxy is a gamified tuition platform (Next.js + Supabase/Postgres). Because students earn XP, coins, levels and leaderboard places, the site is effectively a small **game with prizes** — so the threat isn't just "a hacker steals data", it's "a clever student cheats". The whole security design follows from one rule.

## The golden rule: never trust the client

Anything on a user's device — the browser, the app, the numbers on screen — can be faked by anyone who opens developer tools. So the server and database **assume every student is lying** and re-check everything. Nothing that matters is decided in the browser.

## Defence in depth: three layers

Every sensitive action passes through three independent checks, so a mistake in one layer doesn't sink the app.

| Layer | What it enforces | Example |
|-------|------------------|---------|
| **App (Next.js)** | First-line UX checks, input shapes (Zod) | A homework name must be 2–160 chars |
| **Server actions / API routes** | *Authentication* + *authorization* before any write | `requireTutor()` runs before marking homework |
| **Database (Postgres RLS)** | The final word on which **rows** each person can read or write | A student can only read their own `submissions` |

The database is the backstop: even if the app and server were bypassed entirely and a student talked to the API directly, **Row Level Security (RLS)** still decides what they can touch.

## Key design decisions

- **Least privilege.** Students are granted *read-only* access, plus write access to a tiny allow-list of their *own* profile columns (`display_name`, `theme`, avatar). Everything else — XP, coins, scores, grades — they cannot write at all.
- **All rewards flow through locked functions.** XP and coins are only ever changed inside `SECURITY DEFINER` database functions (e.g. `award_xp`), which students can't call directly. There is no code path where the browser says "give me 500 XP" and is believed.
- **Scores are computed server-side** from an answer key (`question_keys`) that students **cannot even read**.
- **Secrets stay server-side.** The service-role key (which bypasses RLS) is imported with `server-only`, so it can never leak into the browser bundle. The public "anon" key is safe to expose *because* RLS protects every table.
- **Private files** are served through signed, 120-second URLs only after the server confirms you're allowed to see them.
- **Race-safety.** Coin/XP spends lock the player's row (`SELECT … FOR UPDATE`), so you can't double-spend by clicking twice.

## What the security review tested (and the results)

I attacked the app's own code from a troll's seat — a signed-up student making raw API calls and crafted inputs.

| Attack attempted | Result |
|------------------|--------|
| Give myself XP / coins / a quiz score | ❌ Blocked — students can't write those tables; scores are server-computed |
| Mark my own homework / approve myself | ❌ Blocked — every tutor action checks `is_tutor()` in the database |
| Read other students' files or submissions | ❌ Blocked — RLS + signed URLs scoped to my own folder |
| Inject `<script>` via chat or notes (XSS) | ❌ Blocked — all user text renders as plain text; notes are HTML-escaped before formatting |
| Vote many times in a poll | ❌ Blocked — one vote per person (primary key) |
| Buy reward-only / owner cosmetics | ❌ Blocked — enforced in the database |

**Two real issues were found and fixed:**

1. **Griefing via display name** *(low severity)* — a student could bypass the app's length check by calling the raw API and set an enormous or offensive name. No hack (names render as text), but it could break layouts. **Fixed** with a database `CHECK` constraint so the limit holds however the write arrives.
2. **Battle question pre-loading** *(medium severity, game-fairness)* — a battle creates all its rounds up front, and a participant could read every *upcoming* round's question ID via the raw API, then pre-read the questions before each timer started. The answer key was never exposed, but seeing questions early is a decisive edge in a timed battle. **Fixed** by tightening the RLS policy so players see only the current and past rounds.

Both fixes share the theme of the whole app: **move the check as close to the data as possible.**

## Concepts demonstrated (for IT coursework)

This project is a working example of ideas that show up in every security syllabus and the industry-standard **OWASP Top 10**:

- **Authentication vs Authorization** — *who you are* (Discord OAuth login) vs *what you may do* (student vs tutor role checks).
- **Broken Access Control** (OWASP #1) — prevented with Row Level Security and server-side role checks.
- **Injection / XSS** (OWASP #3) — prevented by escaping all user content and never building SQL from raw strings.
- **Principle of least privilege** — students get the minimum rights needed, nothing more.
- **Defence in depth** — three independent layers, so one bug isn't fatal.
- **Input validation** — never trust input; validate in the app (Zod) *and* at the database (CHECK constraints).
- **Secrets management** — privileged keys never reach the client.

**The one-sentence takeaway:** *security isn't a feature you add at the end — it's the assumption that the user is adversarial, enforced at every layer, with the database having the final say.*
