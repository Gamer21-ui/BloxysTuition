-- FunnyBloxy's Academic Comeback: core schema
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Security model:
--   * Every table has row level security (RLS) on.
--   * Students read only what they are allowed to see and change data ONLY through
--     SECURITY DEFINER functions (submit_quiz, battle functions...) so XP, scores and
--     answers can never be forged from the browser.
--   * Tutor actions run on the server (Next.js server actions) after a role check.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- enums
do $$ begin
  create type user_role as enum ('student','tutor');
  create type account_status as enum ('pending','approved','suspended');
  create type tier as enum ('O','AS','A');
  create type pub_status as enum ('draft','locked','scheduled','published');
  create type resource_section as enum ('library','class');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text,
  discord_username text,
  display_name text not null default 'New player',
  discord_avatar_url text,
  role user_role not null default 'student',
  status account_status not null default 'pending',
  tier tier not null default 'O',
  contact text,
  parent_name text,
  parent_contact text,
  roblox_username text,
  roblox_user_id bigint,
  roblox_headshot_url text,
  avatar_mode text not null default 'discord' check (avatar_mode in ('discord','roblox','blocky','both')),
  blocky jsonb not null default '{}'::jsonb,
  title text,
  theme text not null default 'bloxy' check (theme in ('bloxy','gamer','retro')),
  xp integer not null default 0,
  coins integer not null default 0,
  streak integer not null default 0,
  best_streak integer not null default 0,
  last_study_date date,
  announced_level integer not null default 1,
  last_seen_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create or replace function is_tutor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'tutor' and status = 'approved');
$$;

create or replace function is_approved() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and status = 'approved');
$$;

create or replace function tier_rank(t tier) returns int language sql immutable as $$
  select case t when 'O' then 0 when 'AS' then 1 else 2 end;
$$;

-- total XP needed to reach level L: 50 * L * (L-1)  (L1 = 0, L2 = 100, L3 = 300, L5 = 1000, L10 = 4500)
create or replace function level_from_xp(x int) returns int language sql immutable as $$
  select greatest(1, floor((1 + sqrt(1 + 4 * x / 50.0)) / 2)::int);
$$;

-- ---------------------------------------------------------------- courses & content
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  code text not null,
  title text not null,
  tier tier not null,
  exam_label text,
  description text,
  color text not null default '#22c55e',
  icon text not null default 'book',
  sort int not null default 0,
  active boolean not null default true
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  number text not null,
  title text not null,
  summary text,
  sort int not null default 0,
  status pub_status not null default 'published',
  release_at timestamptz
);
create index if not exists chapters_course on chapters(course_id, sort);

create table if not exists parts (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  number text not null,
  title text not null,
  body text,
  video_url text,
  sort int not null default 0,
  status pub_status not null default 'published',
  release_at timestamptz
);
create index if not exists parts_chapter on parts(chapter_id, sort);

-- files and links: "library" (ready-made) or "class" (tutor's lecture notes)
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete cascade,
  part_id uuid references parts(id) on delete cascade,
  section resource_section not null default 'class',
  title text not null,
  kind text not null default 'pdf' check (kind in ('pdf','video','worksheet','link','image','other')),
  file_path text,
  url text,
  status pub_status not null default 'published',
  release_at timestamptz,
  created_at timestamptz not null default now()
);

-- visible to students = published, or scheduled and the release time has passed
create or replace function is_live(s pub_status, rel timestamptz) returns boolean language sql stable as $$
  select s = 'published' or (s = 'scheduled' and rel is not null and rel <= now());
$$;

-- ---------------------------------------------------------------- quizzes
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete cascade,
  title text not null,
  kind text not null default 'quiz' check (kind in ('quiz','speedrun')),
  xp_reward int not null default 50,
  time_limit_sec int,
  status pub_status not null default 'published',
  release_at timestamptz,
  sort int not null default 0
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete cascade,
  quiz_id uuid references quizzes(id) on delete cascade,
  prompt text not null,
  options jsonb not null,          -- ["A","B","C","D"]
  explanation text,
  difficulty int not null default 1,
  battle_ok boolean not null default true
);
create index if not exists questions_quiz on questions(quiz_id);
create index if not exists questions_course on questions(course_id);

-- answers live in their own table that students can never read
create table if not exists question_keys (
  question_id uuid primary key references questions(id) on delete cascade,
  correct int not null
);

create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_ids uuid[] not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int,
  total int,
  time_ms int,
  points int,
  xp_awarded int not null default 0,
  flagged boolean not null default false,
  answers jsonb
);
create index if not exists attempts_user on quiz_attempts(user_id, quiz_id);

-- ---------------------------------------------------------------- XP, achievements, challenges
create table if not exists xp_events (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  amount int not null,
  coins int not null default 0,
  multiplier numeric(4,2) not null default 1,
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists xp_user on xp_events(user_id, created_at desc);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  description text not null,
  icon text not null default 'trophy',
  rarity text not null default 'common' check (rarity in ('common','rare','epic','legendary')),
  xp_reward int not null default 50,
  criteria jsonb not null,          -- {"type":"streak","value":7}
  active boolean not null default true
);

create table if not exists user_achievements (
  user_id uuid references profiles(id) on delete cascade,
  achievement_id uuid references achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- recurring challenges: progress is tracked per period (day or ISO week)
create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  period text not null check (period in ('daily','weekly','once')),
  type text not null check (type in ('quiz_pass','quiz_specific','study_days','homework_on_time','attendance','battle_win','battle_play','xp_earned')),
  target int not null default 1,
  quiz_id uuid references quizzes(id) on delete set null,
  xp_reward int not null default 100,
  coin_reward int not null default 10,
  starts_on date,
  ends_on date,
  active boolean not null default true
);

create table if not exists challenge_progress (
  user_id uuid references profiles(id) on delete cascade,
  challenge_id uuid references challenges(id) on delete cascade,
  period_key text not null,
  progress int not null default 0,
  completed_at timestamptz,
  primary key (user_id, challenge_id, period_key)
);

-- ---------------------------------------------------------------- attendance, homework, reports
create table if not exists class_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete set null,
  title text not null,
  held_on date not null default current_date
);

create table if not exists attendance (
  session_id uuid references class_sessions(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  status text not null check (status in ('present','late','absent','excused')),
  primary key (session_id, user_id)
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete set null,
  title text not null,
  kind text not null default 'homework' check (kind in ('homework','worksheet','mock','paper')),
  instructions text,
  file_path text,
  due_at timestamptz,
  max_score int not null default 20,
  xp_reward int not null default 80,
  status pub_status not null default 'published',
  release_at timestamptz,
  answers_released boolean not null default false,
  solution_path text,
  mark_scheme_path text,
  solution_video_url text,
  created_at timestamptz not null default now()
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  file_paths text[] not null default '{}',
  text_answer text,
  submitted_at timestamptz not null default now(),
  score int,
  feedback text,
  graded_at timestamptz,
  unique (assignment_id, user_id)
);

create table if not exists tutor_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists student_topics (
  student_id uuid references profiles(id) on delete cascade,
  chapter_id uuid references chapters(id) on delete cascade,
  label text not null check (label in ('weak','strong')),
  primary key (student_id, chapter_id)
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id) on delete cascade,
  period_label text not null,
  parent_name text,
  comment text not null,
  stats jsonb not null default '{}'::jsonb,
  shared_with_student boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists notifications (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notif_user on notifications(user_id, created_at desc);

-- ---------------------------------------------------------------- battles
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  mode text not null check (mode in ('1v1','2v2')),
  course_id uuid references courses(id) on delete set null,
  host_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby','live','finished','cancelled')),
  round_count int not null default 5,
  round_seconds int not null default 20,
  current_round int not null default 0,
  phase text not null default 'question' check (phase in ('question','reveal')),
  phase_started_at timestamptz,
  winner_team int,
  rewarded boolean not null default false,
  announced boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists battle_players (
  battle_id uuid references battles(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  team int not null check (team in (1,2)),
  score int not null default 0,
  joined_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

create table if not exists battle_rounds (
  battle_id uuid references battles(id) on delete cascade,
  round_no int not null,
  question_id uuid not null references questions(id),
  correct int,                     -- filled in only when the round is revealed
  primary key (battle_id, round_no)
);

create table if not exists battle_answers (
  battle_id uuid references battles(id) on delete cascade,
  round_no int not null,
  user_id uuid references profiles(id) on delete cascade,
  choice int,
  correct boolean,
  ms int,
  points int not null default 0,
  revealed boolean not null default false,
  primary key (battle_id, round_no, user_id)
);
