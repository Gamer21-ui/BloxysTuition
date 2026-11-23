# Database schema

Source of truth: `supabase/migrations/`. 0001 = tables, 0002 = game logic functions, 0003 = security (RLS, grants, storage, realtime), 0004 = average topic rating, 0005 = exam mode + mistakes deck, 0006 = coin shop.

## People

| Table | Purpose | Students can read | Students can write |
|---|---|---|---|
| `profiles` | One row per Discord account: role, status, tier (O/AS/A), avatar, theme, XP, coins, streak, parent info, equipped cosmetics | own row | display name, theme, avatar mode, contact (avatar look is saved by the server after checks) |
| `tutor_notes` | Private notes about a student | ❌ never | ❌ |
| `student_topics` | Per-chapter rating: weak / average / strong | own | ❌ |
| `reports` | Parent progress reports (stats snapshot + comment) | own, if shared | ❌ |

## Content

| Table | Purpose |
|---|---|
| `courses` | Subject (code, tier, exam label, colour, icon) |
| `chapters` | Syllabus chapter, with `status` (draft/locked/scheduled/published) and `release_at` |
| `parts` | Lesson notes inside a chapter (Markdown body, optional video) |
| `resources` | Files/links, `section` = `library` (ready-made) or `class` (your lecture notes) |
| `quizzes` | `quiz` (per chapter), `speedrun`, `exam` (timed, draws `question_count` from released chapters) or `review` (mistakes deck), the last three per course |
| `questions` | Prompt + options (no answer!) |
| `question_keys` | The correct option index. Tutor-only. |
| `quiz_attempts` | One per play: questions served, answers, score, time, XP, flagged |
| `review_items` | Mistakes deck: a question a student got wrong, its box (0/1/2) and when it's next due |

## Game

| Table | Purpose |
|---|---|
| `xp_events` | Ledger of every XP/coin change with reason and multiplier |
| `achievements` / `user_achievements` | Badge definitions (criteria JSON) and who earned them |
| `challenges` / `challenge_progress` | Daily/weekly/once quests and per-period progress |
| `battles`, `battle_players`, `battle_rounds`, `battle_answers` | Live quiz battles |
| `shop_items` / `user_items` | Shop catalogue (unique per kind + code) and what each student owns. Equipped cosmetics live on `profiles` (`title`, `name_style`, `frame`, `blocky.hat`, `blocky.pattern`); `profiles.streak_freezes` counts freezes held |

## Class

| Table | Purpose |
|---|---|
| `class_sessions` / `attendance` | Classes and present/late/absent/excused marks |
| `assignments` / `submissions` | Homework, hand-ins, marks, feedback, released solutions |
| `announcements` / `notifications` | Broadcasts and per-user bell notifications |

## Key functions (callable from the app)

| Function | Who | Does |
|---|---|---|
| `start_quiz(quiz)` / `submit_quiz(attempt, answers)` | student | Serve shuffled questions; mark, award XP, update quests and badges |
| `create_battle`, `join_battle`, `leave_battle`, `start_battle`, `battle_question`, `answer_battle`, `tick_battle` | student | Battle lifecycle |
| `get_leaderboard(kind)`, `profile_cards(ids)` | student | Public-safe views of other players |
| `buy_item(item)`, `equip_item(kind, code)` | student | Spend coins (checks level and balance) and equip/take off cosmetics |
| `tutor_award`, `mark_attendance`, `grade_submission` | tutor | Award XP through the same ledger |

Internal (not callable from the browser): `award_xp`, `bump_challenge`, `check_achievements`, `notify`, `battle_reveal`, `battle_finish`.

## Storage buckets (all private)

* `resources`: notes, worksheets, homework question files
* `submissions`: student hand-ins, under `<user id>/<assignment id>/`
* `solutions`: worked solutions and mark schemes (downloadable only after release)
