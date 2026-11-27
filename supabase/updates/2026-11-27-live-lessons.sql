-- Live lessons + new menu (27 Nov 2026). Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Needs the arcade/tutorial updates from before (site_settings, award_xp).
-- 🎬 Live lessons: the tutor drives an interactive visualization on everyone's screen.
-- Only the tutor can move between steps or change the shared state (sliders etc.).
-- At checkpoints students answer a task; answers are checked HERE against live_keys
-- (students can't read the keys), one try per checkpoint, small capped rewards.

-- menu style switch (new hub menu vs the classic long menu), set by the tutor
alter table site_settings add column if not exists nav_style text not null default 'new';
do $$ begin
  alter table site_settings add constraint nav_style_ok check (nav_style in ('new', 'classic'));
exception when duplicate_object then null; end $$;

create or replace function tutor_set_nav_style(p_style text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  if p_style not in ('new', 'classic') then raise exception 'bad style'; end if;
  update site_settings set nav_style = p_style where id = 1;
end $$;
revoke all on function tutor_set_nav_style(text) from public, anon;
grant execute on function tutor_set_nav_style(text) to authenticated;

create table if not exists live_sessions (
  id uuid primary key default gen_random_uuid(),
  viz text not null check (char_length(viz) between 1 and 60),
  step int not null default 0 check (step between 0 and 200),
  state jsonb not null default '{}'::jsonb,        -- shared interactive state (e.g. a slider), tutor-controlled
  reveal boolean not null default false,          -- tutor has revealed the answer for the current checkpoint
  status text not null default 'live' check (status in ('live', 'ended')),
  started_by uuid references profiles(id) on delete set null,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists live_sessions_status on live_sessions(status, started_at desc);

create table if not exists live_answers (
  session_id uuid not null references live_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  step int not null,
  answer jsonb not null,
  correct boolean not null,
  xp int not null default 0,
  coins int not null default 0,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id, step)
);

-- correct answers per visualization checkpoint (kept in sync with src/lib/viz by scripts/check-viz-keys)
create table if not exists live_keys (
  viz text not null,
  step int not null,
  answer jsonb not null,
  primary key (viz, step)
);

alter table live_sessions enable row level security;
alter table live_answers enable row level security;
alter table live_keys enable row level security;
drop policy if exists live_sessions_select on live_sessions;
create policy live_sessions_select on live_sessions for select using (is_approved());
drop policy if exists live_answers_select on live_answers;
create policy live_answers_select on live_answers for select using (user_id = auth.uid() or is_tutor());
drop policy if exists live_keys_select on live_keys;
create policy live_keys_select on live_keys for select using (is_tutor());   -- students never read keys
grant select on live_sessions, live_answers, live_keys to authenticated;
grant all on live_sessions, live_answers, live_keys to service_role;

create or replace function live_start(p_viz text) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  if p_viz !~ '^[a-z0-9-]{1,60}$' then raise exception 'unknown lesson'; end if;
  update live_sessions set status = 'ended', ended_at = now() where status = 'live';   -- one live lesson at a time
  insert into live_sessions(viz, started_by) values (p_viz, auth.uid()) returning id into v;
  return v;
end $$;

create or replace function live_goto(p_session uuid, p_step int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  update live_sessions set step = greatest(0, least(p_step, 200)), reveal = false, updated_at = now()
  where id = p_session and status = 'live';
end $$;

create or replace function live_set_state(p_session uuid, p_state jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  if pg_column_size(p_state) > 2000 then raise exception 'state too big'; end if;
  update live_sessions set state = coalesce(p_state, '{}'::jsonb), updated_at = now() where id = p_session and status = 'live';
end $$;

create or replace function live_reveal(p_session uuid, p_on boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  update live_sessions set reveal = coalesce(p_on, true), updated_at = now() where id = p_session and status = 'live';
end $$;

create or replace function live_end(p_session uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  update live_sessions set status = 'ended', ended_at = now(), updated_at = now() where id = p_session and status = 'live';
end $$;

-- A student answers the CURRENT checkpoint. One try only. Correct = +10 XP +2 coins,
-- capped at 100 XP of live-lesson rewards per day (Mauritius time).
create or replace function live_answer(p_session uuid, p_step int, p_answer jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s live_sessions%rowtype; k jsonb; ok boolean; prev live_answers%rowtype;
        today_xp int; xp_gain int := 0; coin_gain int := 0; res jsonb;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into s from live_sessions where id = p_session;
  if not found or s.status <> 'live' then raise exception 'lesson ended'; end if;
  if s.step <> p_step then raise exception 'this checkpoint has moved on'; end if;
  if s.reveal then raise exception 'answers are closed for this checkpoint'; end if;
  select answer into k from live_keys where viz = s.viz and step = p_step;
  if k is null then raise exception 'no task here'; end if;
  select * into prev from live_answers where session_id = p_session and user_id = auth.uid() and step = p_step;
  if found then
    return jsonb_build_object('correct', prev.correct, 'xp', 0, 'coins', 0, 'already', true);
  end if;
  ok := (p_answer = k);
  if ok and not is_tutor() then
    select coalesce(sum(a.xp), 0) into today_xp from live_answers a
    where a.user_id = auth.uid() and (a.created_at at time zone 'Indian/Mauritius')::date = today_local();
    if today_xp < 100 then
      res := award_xp(auth.uid(), 10, 'live', s.viz, null, 2, true);
      xp_gain := coalesce((res->>'xp')::int, 0);
      coin_gain := 2;
    end if;
  end if;
  insert into live_answers(session_id, user_id, step, answer, correct, xp, coins)
  values (p_session, auth.uid(), p_step, p_answer, ok, xp_gain, coin_gain);
  return jsonb_build_object('correct', ok, 'xp', xp_gain, 'coins', coin_gain, 'already', false);
end $$;

revoke all on function live_start(text) from public, anon;
revoke all on function live_goto(uuid, int) from public, anon;
revoke all on function live_set_state(uuid, jsonb) from public, anon;
revoke all on function live_reveal(uuid, boolean) from public, anon;
revoke all on function live_end(uuid) from public, anon;
revoke all on function live_answer(uuid, int, jsonb) from public, anon;
grant execute on function live_start(text) to authenticated;
grant execute on function live_goto(uuid, int) to authenticated;
grant execute on function live_set_state(uuid, jsonb) to authenticated;
grant execute on function live_reveal(uuid, boolean) to authenticated;
grant execute on function live_end(uuid) to authenticated;
grant execute on function live_answer(uuid, int, jsonb) to authenticated;

do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['live_sessions', 'live_answers'] loop
      begin execute format('alter publication supabase_realtime add table %I', t);
      exception when duplicate_object then null; end;
    end loop;
  end if;
end $$;

-- answer keys (generated from src/lib/viz; re-run safe)
-- @@KEYS@@ (generated by scripts/viz-keys.mjs, do not edit by hand)
delete from live_keys where viz in ('cpu-fde', 'control-lab');
insert into live_keys(viz, step, answer) values
  ('cpu-fde', 1, '1'::jsonb),
  ('cpu-fde', 2, '"PC"'::jsonb),
  ('cpu-fde', 3, '0'::jsonb),
  ('cpu-fde', 4, '1'::jsonb),
  ('cpu-fde', 6, '"CU"'::jsonb),
  ('cpu-fde', 8, '[0,1,2,3]'::jsonb),
  ('cpu-fde', 9, '"ALU"'::jsonb),
  ('cpu-fde', 11, '0'::jsonb),
  ('cpu-fde', 12, '1'::jsonb),
  ('control-lab', 1, '1'::jsonb),
  ('control-lab', 2, '0'::jsonb),
  ('control-lab', 3, '0'::jsonb),
  ('control-lab', 4, '"actuator"'::jsonb),
  ('control-lab', 5, '[0,1,2,3]'::jsonb),
  ('control-lab', 6, '0'::jsonb),
  ('control-lab', 7, '2'::jsonb),
  ('control-lab', 8, '0'::jsonb);
-- @@END-KEYS@@
