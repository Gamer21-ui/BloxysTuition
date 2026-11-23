# Getting FunnyBloxy online

You need: the GitHub repo (done ✅), and free accounts on **Supabase**, **Vercel** and the **Discord Developer Portal**. Sign in to all three with GitHub/Discord to save time.

> ⚠️ **Do step 6 (your own first login) before sharing the link with anyone.** The very first person to sign in becomes the tutor/admin.

---

## 1. Supabase (database, login, files)

1. Go to <https://supabase.com> → **New project**. Name it `funnybloxy`, pick a strong database password (save it in a password manager), region **closest to Mauritius** (e.g. *Mumbai* or *Frankfurt*).
2. When it's ready: **SQL Editor → New query** → open `supabase/setup.sql` from the repo, copy everything, paste, **Run**. You should see "Success. No rows returned".
   *(This creates every table, security rule, storage bucket, the 4 O Level courses, 29 chapters, 145 starter questions, badges and quests.)*
3. **Project Settings → API**. Keep this tab open. You'll need:
   * `Project URL`
   * `anon public` key
   * `service_role` key (**secret!** never paste it in Discord or in code)

## 2. Discord app (for "Sign in with Discord")

1. <https://discord.com/developers/applications> → **New Application** → name it `FunnyBloxy`.
2. **OAuth2** → copy the **Client ID**, click **Reset Secret** and copy the **Client Secret**.
3. Still in OAuth2 → **Redirects** → add: `https://YOUR-PROJECT.supabase.co/auth/v1/callback` (your Supabase Project URL + `/auth/v1/callback`). Save.
4. Back in Supabase: **Authentication → Sign In / Providers → Discord** → enable, paste Client ID + Secret → Save.

## 3. Discord webhooks (bot posts)

In your Discord server:

1. Create a channel like `#bot-feed` → ⚙️ **Edit Channel → Integrations → Webhooks → New Webhook** → **Copy Webhook URL**. This gets level-ups, battle results and new homework.
2. (Optional) Do the same for `#announcements`, which gets your announcements.
3. **Server Settings → Invites** (or right-click the server → Invite People) → make a **never-expiring** invite link for the home page button.

## 4. Vercel (hosting)

1. <https://vercel.com> → **Add New → Project** → import `Gamer21-ui/BloxysTuition`. Framework is detected as Next.js.
2. Before clicking Deploy, open **Environment Variables** and add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
| `NEXT_PUBLIC_SITE_URL` | leave blank for now |
| `DISCORD_WEBHOOK_URL` | `#bot-feed` webhook |
| `DISCORD_ANNOUNCE_WEBHOOK_URL` | `#announcements` webhook (optional) |
| `NEXT_PUBLIC_DISCORD_INVITE` | your invite link |

3. **Deploy**. When it finishes you get a URL like `https://bloxys-tuition.vercel.app`.
4. Set `NEXT_PUBLIC_SITE_URL` to that URL (Settings → Environment Variables), then **Deployments → ⋯ → Redeploy**.

## 5. Tell Supabase where the site lives

Supabase → **Authentication → URL Configuration**:

* **Site URL**: your Vercel URL
* **Redirect URLs**: add `https://YOUR-SITE.vercel.app/auth/callback` and `http://localhost:3000/auth/callback`

## 6. Become the tutor

Open your site → **Sign in with Discord**. Because you're first, you're the tutor and already approved. You'll see **Tutor HQ** in the sidebar.

## 7. Invite students

Share the site link in Discord. Each student signs in, lands on a "waiting for approval" screen, and shows up in **Tutor → Students**. Click **Approve**, then open their page to set parent name/contact (used on the parent receipt).

## 8. Quick test with your 4 testers

* Everyone: **Profile** → pick a theme, link Roblox or build a blocky avatar.
* Two of you: **Battles → Create lobby** → share the 5-letter code → other person joins → host presses **Start**.
* Tutor: **Content** → put a chapter on *scheduled* for 5 minutes from now and watch it unlock.

---

## Costs and the fine print (read this once)

| Service | Free tier | Watch out for |
|---|---|---|
| **Supabase** | 500 MB database, 1 GB files, 2 projects | **Free projects pause after 1 week with no activity** (e.g. a long school holiday). Data is kept; click *Restore* in the dashboard. Pro is $25/month and never pauses. |
| **Vercel** | Hobby plan, plenty for <20 students | **Hobby is for personal, non-commercial use only.** If you charge for the tuition, Vercel's terms say you need **Pro ($20/month)**. Free alternative: Cloudflare Workers (allows commercial use, needs a small adapter; ask and it can be added). |
| **Discord** | Free | Nothing |

What fits in the free tiers: 20 students doing quizzes daily is a few MB of data a year. The 1 GB of files is the first limit you'd hit: roughly 200–400 PDFs of notes and homework photos. Keep big videos on YouTube (unlisted) and paste the link instead of uploading.

## Updating the site later

Any change pushed to `main` on GitHub redeploys automatically on Vercel. Database changes come as new files in `supabase/migrations/`: run each new file once in the SQL editor, in order.

## Backups

The free Supabase plan has no automatic backups. Once a month, run `pg_dump "<connection string>" > backup.sql` using the connection string from **Project Settings → Database** (or upgrade to Pro, which backs up daily).

## Security checklist

* Never share `SUPABASE_SERVICE_ROLE_KEY`. If it leaks: Supabase → API → **Roll** the key and update Vercel.
* Every table has row-level security. Students can only change their own name, theme, avatar and contact; XP and scores are only ever written by database functions.
* Quiz answers live in a table students can't read; battle answers stay hidden until the round reveal.
* Files are in private buckets; links are generated per request and expire after 2 minutes.
