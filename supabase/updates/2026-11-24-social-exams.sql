-- Friends, parties, chat, exams and pixel shop update (24 Nov 2026). Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Note: the first time this runs, the four practice tests are LOCKED so you can open exams yourself (Tutor HQ > Exams).

-- Friends, parties, chat, battle levels, tutor-run exams (windows, attempt limits, focus tracking),
-- and two new avatar slots (face accessory, back item) for the shop.

-- ================================================================ friends
create table if not exists friendships (
  requester uuid not null references profiles(id) on delete cascade,
  addressee uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
alter table friendships enable row level security;
drop policy if exists fr_select on friendships;
create policy fr_select on friendships for select using (auth.uid() in (requester, addressee) or is_tutor());
grant select on friendships to authenticated;
grant all on friendships to service_role;

create or replace function are_friends(a uuid, b uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from friendships where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a)));
$$;

create or replace function send_friend_request(p_user uuid) returns text
language plpgsql security definer set search_path = public as $$
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_user = auth.uid() then raise exception 'that is you'; end if;
  if not exists (select 1 from profiles where id = p_user and status = 'approved') then raise exception 'player not found'; end if;
  if are_friends(auth.uid(), p_user) then return 'already friends'; end if;
  -- they already asked you: accept instead
  if exists (select 1 from friendships where requester = p_user and addressee = auth.uid()) then
    update friendships set status = 'accepted' where requester = p_user and addressee = auth.uid();
    perform notify(p_user, (select display_name from profiles where id = auth.uid()) || ' accepted your friend request', null, '/friends');
    return 'accepted';
  end if;
  insert into friendships(requester, addressee) values (auth.uid(), p_user) on conflict do nothing;
  perform notify(p_user, (select display_name from profiles where id = auth.uid()) || ' sent you a friend request', null, '/friends');
  return 'sent';
end $$;

create or replace function respond_friend_request(p_user uuid, p_accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_accept then
    update friendships set status = 'accepted' where requester = p_user and addressee = auth.uid() and status = 'pending';
    if found then perform notify(p_user, (select display_name from profiles where id = auth.uid()) || ' accepted your friend request', null, '/friends'); end if;
  else
    delete from friendships where requester = p_user and addressee = auth.uid() and status = 'pending';
  end if;
end $$;

create or replace function remove_friend(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from friendships where (requester = auth.uid() and addressee = p_user) or (requester = p_user and addressee = auth.uid());
end $$;

-- everyone approved, as public-safe cards (for finding friends)
create or replace function student_directory() returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, tier tier, name_style text, frame text, role user_role)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp), p.tier, p.name_style, p.frame, p.role
  from profiles p where p.status = 'approved' and is_approved() order by p.display_name;
$$;

-- ================================================================ parties (up to 4, leader takes everyone into battles)
create table if not exists parties (
  id uuid primary key default gen_random_uuid(),
  leader_id uuid not null unique references profiles(id) on delete cascade,
  battle_code text,
  created_at timestamptz not null default now()
);
create table if not exists party_members (
  party_id uuid not null references parties(id) on delete cascade,
  user_id uuid not null unique references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (party_id, user_id)
);
create table if not exists party_invites (
  party_id uuid not null references parties(id) on delete cascade,
  to_id uuid not null references profiles(id) on delete cascade,
  from_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (party_id, to_id)
);
alter table parties enable row level security;
alter table party_members enable row level security;
alter table party_invites enable row level security;

create or replace function my_party() returns uuid language sql stable security definer set search_path = public as $$
  select party_id from party_members where user_id = auth.uid();
$$;
drop policy if exists party_select on parties;
create policy party_select on parties for select using (id = my_party() or is_tutor()
  or exists (select 1 from party_invites i where i.party_id = parties.id and i.to_id = auth.uid()));
drop policy if exists pm_select on party_members;
create policy pm_select on party_members for select using (party_id = my_party() or is_tutor()
  or exists (select 1 from party_invites i where i.party_id = party_members.party_id and i.to_id = auth.uid()));
drop policy if exists pi_select on party_invites;
create policy pi_select on party_invites for select using (to_id = auth.uid() or from_id = auth.uid() or party_id = my_party() or is_tutor());
grant select on parties, party_members, party_invites to authenticated;
grant all on parties, party_members, party_invites to service_role;

create or replace function party_invite(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if not are_friends(auth.uid(), p_user) then raise exception 'you can only invite friends'; end if;
  pid := my_party();
  if pid is null then
    insert into parties(leader_id) values (auth.uid()) returning id into pid;
    insert into party_members(party_id, user_id) values (pid, auth.uid());
  elsif (select leader_id from parties where id = pid) <> auth.uid() then
    raise exception 'only the party leader can invite';
  end if;
  if (select count(*) from party_members where party_id = pid) >= 4 then raise exception 'party is full (4 max)'; end if;
  if exists (select 1 from party_members where party_id = pid and user_id = p_user) then raise exception 'already in your party'; end if;
  insert into party_invites(party_id, to_id, from_id) values (pid, p_user, auth.uid()) on conflict do nothing;
  perform notify(p_user, (select display_name from profiles where id = auth.uid()) || ' invited you to their party', 'Join so you go into battles together.', '/friends');
end $$;

create or replace function party_leave() returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := my_party();
begin
  if pid is null then return; end if;
  if (select leader_id from parties where id = pid) = auth.uid() then
    delete from parties where id = pid;      -- leader leaving disbands the party
  else
    delete from party_members where party_id = pid and user_id = auth.uid();
  end if;
end $$;

create or replace function party_accept(p_party uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from party_invites where party_id = p_party and to_id = auth.uid()) then raise exception 'invite not found'; end if;
  if (select count(*) from party_members where party_id = p_party) >= 4 then raise exception 'party is full'; end if;
  perform party_leave();
  insert into party_members(party_id, user_id) values (p_party, auth.uid());
  delete from party_invites where to_id = auth.uid();
end $$;

create or replace function party_decline(p_party uuid) returns void
language sql security definer set search_path = public as $$
  delete from party_invites where party_id = p_party and to_id = auth.uid();
$$;

create or replace function party_kick(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare pid uuid := my_party();
begin
  if pid is null or (select leader_id from parties where id = pid) <> auth.uid() then raise exception 'only the leader can remove people'; end if;
  if p_user = auth.uid() then raise exception 'use leave instead'; end if;
  delete from party_members where party_id = pid and user_id = p_user;
end $$;

-- ================================================================ battles: a level, and parties follow their leader in
alter table battles add column if not exists tier tier;

-- puts the caller's party (if they lead one) into battle b, filling the given team first, then the other
create or replace function bring_party(b uuid, p_team int) returns void
language plpgsql security definer set search_path = public as $$
declare bt battles%rowtype; cap int; m record; t int; pid uuid;
begin
  select * into bt from battles where id = b;
  select id into pid from parties where leader_id = auth.uid();
  if pid is null then return; end if;
  cap := case bt.mode when '1v1' then 1 else 2 end;
  update parties set battle_code = bt.code where id = pid;
  for m in select user_id from party_members where party_id = pid and user_id <> auth.uid() order by joined_at loop
    if exists (select 1 from battle_players where battle_id = b and user_id = m.user_id) then continue; end if;
    t := case when (select count(*) from battle_players where battle_id = b and team = p_team) < cap then p_team
              when (select count(*) from battle_players where battle_id = b and team = 3 - p_team) < cap then 3 - p_team
              else null end;
    exit when t is null;
    insert into battle_players(battle_id, user_id, team) values (b, m.user_id, t);
    perform notify(m.user_id, 'Your party leader started a battle', 'Battle code ' || bt.code, '/battles/' || bt.code);
  end loop;
end $$;
revoke execute on function bring_party(uuid, int) from public, anon, authenticated;

drop function if exists create_battle(text, uuid, int);
create or replace function create_battle(p_mode text, p_course uuid default null, p_rounds int default 5, p_tier tier default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text; b uuid; lvl tier;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_mode not in ('1v1','2v2') then raise exception 'bad mode'; end if;
  lvl := coalesce((select tier from courses where id = p_course), p_tier, (select tier from profiles where id = auth.uid()));
  loop
    c := upper(substr(md5(random()::text), 1, 5));
    exit when not exists (select 1 from battles where code = c);
  end loop;
  insert into battles(code, mode, course_id, host_id, round_count, tier)
  values (c, p_mode, p_course, auth.uid(), least(greatest(coalesce(p_rounds, 5), 3), 10), lvl)
  returning id into b;
  insert into battle_players(battle_id, user_id, team) values (b, auth.uid(), 1);
  perform bring_party(b, 1);
  return c;
end $$;

create or replace function join_battle(p_code text, p_team int default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; cap int; t int; n1 int; n2 int;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into b from battles where code = upper(p_code) for update;
  if not found then raise exception 'battle not found'; end if;
  if exists(select 1 from battle_players where battle_id = b.id and user_id = auth.uid()) then
    if b.status = 'lobby' and p_team in (1,2) then
      cap := case b.mode when '1v1' then 1 else 2 end;
      if (select count(*) from battle_players where battle_id = b.id and team = p_team and user_id <> auth.uid()) < cap then
        update battle_players set team = p_team where battle_id = b.id and user_id = auth.uid();
      end if;
    end if;
    return b.id;
  end if;
  if b.status <> 'lobby' then raise exception 'battle already started'; end if;
  cap := case b.mode when '1v1' then 1 else 2 end;
  select count(*) filter (where team = 1), count(*) filter (where team = 2) into n1, n2
  from battle_players where battle_id = b.id;
  t := coalesce(p_team, case when n1 <= n2 then 1 else 2 end);
  if (t = 1 and n1 >= cap) then t := 2; end if;
  if (t = 2 and n2 >= cap) then t := 1; end if;
  if (t = 1 and n1 >= cap) or (t = 2 and n2 >= cap) then raise exception 'battle is full'; end if;
  insert into battle_players(battle_id, user_id, team) values (b.id, auth.uid(), t);
  perform bring_party(b.id, t);
  return b.id;
end $$;

create or replace function start_battle(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; i int := 0; q uuid;
begin
  select * into b from battles where id = p_battle for update;
  if b.host_id <> auth.uid() then raise exception 'only the host can start'; end if;
  if b.status <> 'lobby' then raise exception 'already started'; end if;
  if (select count(distinct team) from battle_players where battle_id = b.id) < 2 then
    raise exception 'both teams need at least one player';
  end if;
  for q in
    select qq.id from questions qq join question_keys k on k.question_id = qq.id join courses cc on cc.id = qq.course_id
    where qq.battle_ok
      and (case when b.course_id is not null then qq.course_id = b.course_id
                when b.tier is not null then cc.tier = b.tier else true end)
    order by random() limit b.round_count
  loop
    i := i + 1;
    insert into battle_rounds(battle_id, round_no, question_id) values (b.id, i, q);
  end loop;
  if i = 0 then raise exception 'no questions available for this level yet'; end if;
  update battles set status = 'live', round_count = i, current_round = 1, phase = 'question',
    phase_started_at = now() where id = b.id;
end $$;

-- ================================================================ chat (with battle requests)
create table if not exists chat_messages (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  kind text not null default 'text' check (kind in ('text', 'battle')),
  battle_code text,
  mode text,
  tier tier,
  course_title text,
  deleted boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists chat_recent on chat_messages(created_at desc);
alter table chat_messages enable row level security;
drop policy if exists chat_select on chat_messages;
create policy chat_select on chat_messages for select using (is_approved() and (not deleted or is_tutor()));
grant select on chat_messages to authenticated;
grant all on chat_messages to service_role;

create or replace function post_chat(p_body text, p_battle_code text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; mid bigint; body text := btrim(coalesce(p_body, ''));
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if (select count(*) from chat_messages where user_id = auth.uid() and created_at > now() - interval '30 seconds') >= 6 then
    raise exception 'slow down a bit';
  end if;
  if p_battle_code is not null then
    select * into b from battles where code = upper(p_battle_code);
    if not found or b.status <> 'lobby' then raise exception 'that battle is not open'; end if;
    insert into chat_messages(user_id, body, kind, battle_code, mode, tier, course_title)
    values (auth.uid(), coalesce(nullif(body, ''), 'Join my battle!'), 'battle', b.code, b.mode, b.tier,
            (select title from courses where id = b.course_id))
    returning id into mid;
  else
    if body = '' then raise exception 'empty message'; end if;
    insert into chat_messages(user_id, body) values (auth.uid(), left(body, 500)) returning id into mid;
  end if;
  return mid;
end $$;

create or replace function delete_chat(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update chat_messages set deleted = true where id = p_id and (user_id = auth.uid() or is_tutor());
end $$;

-- ================================================================ exams run by the tutor
alter table quizzes add column if not exists closes_at timestamptz;
alter table quizzes add column if not exists max_attempts int;
alter table quiz_attempts add column if not exists focus_lost int not null default 0;

-- One time only: practice tests start locked so the tutor decides when exams open.
create table if not exists app_flags (key text primary key, set_at timestamptz not null default now());
alter table app_flags enable row level security;
do $$ begin
  if not exists (select 1 from app_flags where key = 'exams_locked_v1') then
    update quizzes set status = 'locked' where kind = 'exam' and status = 'published';
    insert into app_flags(key) values ('exams_locked_v1');
  end if;
end $$;

create or replace function start_quiz(p_quiz uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  qz quizzes%rowtype;
  ids uuid[];
  att uuid;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into qz from quizzes where id = p_quiz;
  if not found or not (is_live(qz.status, qz.release_at) or is_tutor()) then
    raise exception 'quiz locked';
  end if;
  if qz.closes_at is not null and now() > qz.closes_at and not is_tutor() then raise exception 'exam closed'; end if;
  if qz.max_attempts is not null and not is_tutor() and
     (select count(*) from quiz_attempts where user_id = auth.uid() and quiz_id = qz.id) >= qz.max_attempts then
    raise exception 'no attempts left';
  end if;
  if qz.chapter_id is not null and not is_tutor() and not exists (
      select 1 from chapters c where c.id = qz.chapter_id and is_live(c.status, c.release_at)) then
    raise exception 'chapter locked';
  end if;

  if qz.kind = 'speedrun' then
    select array_agg(id) into ids from (
      select q.id from questions q join question_keys k on k.question_id = q.id
      where (q.quiz_id = qz.id) or (qz.chapter_id is null and q.course_id = qz.course_id and q.battle_ok)
      order by random() limit 10) s;
  elsif qz.kind = 'exam' then
    select array_agg(id) into ids from (
      select q.id from questions q
      join question_keys k on k.question_id = q.id
      join chapters c on c.id = q.chapter_id
      where q.course_id = qz.course_id and (is_live(c.status, c.release_at) or is_tutor())
      order by random() limit coalesce(qz.question_count, 40)) s;
  elsif qz.kind = 'review' then
    select array_agg(question_id) into ids from (
      select r.question_id from review_items r join question_keys k on k.question_id = r.question_id
      where r.user_id = auth.uid() and r.course_id = qz.course_id and r.due_at <= now()
      order by r.due_at limit 10) s;
    if ids is null then raise exception 'nothing to review'; end if;
  else
    select array_agg(id) into ids from (
      select q.id from questions q join question_keys k on k.question_id = q.id
      where q.quiz_id = qz.id order by random()) s;
  end if;
  if ids is null then raise exception 'quiz has no questions yet'; end if;

  insert into quiz_attempts(user_id, quiz_id, question_ids) values (auth.uid(), qz.id, ids)
  returning id into att;

  return jsonb_build_object(
    'attempt_id', att, 'kind', qz.kind, 'title', qz.title, 'time_limit_sec', qz.time_limit_sec,
    'questions', (select jsonb_agg(jsonb_build_object('id', q.id, 'prompt', q.prompt, 'options', q.options)
                   order by array_position(ids, q.id))
                  from questions q where q.id = any(ids)));
end $$;

-- submit_quiz gains a count of how often the student left the exam screen (shown to the tutor)
drop function if exists submit_quiz(uuid, jsonb);
create or replace function submit_quiz(p_attempt uuid, p_answers jsonb, p_focus_lost int default 0) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  att quiz_attempts%rowtype;
  qz quizzes%rowtype;
  crs courses%rowtype;
  n int;
  correct_n int := 0;
  elapsed int;
  pts int := 0;
  frac numeric;
  prev numeric;
  xp_base int := 0;
  res jsonb;
  results jsonb;
  is_flagged boolean := false;
  passed_today boolean;
  runs_today int;
  r record;
  added int := 0;
  mastered int := 0;
begin
  select * into att from quiz_attempts where id = p_attempt and user_id = auth.uid() for update;
  if not found then raise exception 'attempt not found'; end if;
  if att.finished_at is not null then raise exception 'already submitted'; end if;
  select * into qz from quizzes where id = att.quiz_id;
  select * into crs from courses where id = qz.course_id;

  n := array_length(att.question_ids, 1);
  elapsed := (extract(epoch from (now() - att.started_at)) * 1000)::int;

  select count(*) into correct_n
  from unnest(att.question_ids) qid join question_keys k on k.question_id = qid
  where (p_answers->>(qid::text)) is not null and (p_answers->>(qid::text))::int = k.correct;

  select jsonb_agg(jsonb_build_object(
      'id', q.id, 'choice', (p_answers->>(q.id::text))::int, 'correct', k.correct,
      'right', coalesce((p_answers->>(q.id::text))::int = k.correct, false), 'explanation', q.explanation)
      order by array_position(att.question_ids, q.id))
  into results
  from questions q join question_keys k on k.question_id = q.id where q.id = any(att.question_ids);

  -- anti-cheat: nobody genuinely answers faster than ~1.2 s per question; overtime also flags
  if elapsed < 1200 * n then is_flagged := true; end if;
  if qz.time_limit_sec is not null and elapsed > (qz.time_limit_sec + 15) * 1000 then is_flagged := true; end if;

  frac := correct_n::numeric / n;
  pts := correct_n * 100 + floor(greatest(0, n * 15000 - elapsed) / 1000.0 * 10 * frac)::int;

  if not is_flagged then
    if qz.kind = 'quiz' then
      -- only the improvement on your best score pays, so retakes can't farm XP
      select coalesce(max(score::numeric / nullif(total, 0)), 0) into prev
      from quiz_attempts where user_id = att.user_id and quiz_id = qz.id and finished_at is not null and not flagged;
      xp_base := round(qz.xp_reward * greatest(0, frac - prev));
    elsif qz.kind = 'review' then
      -- 5 XP per mistake fixed; items only come back on a schedule, so this can't be farmed
      xp_base := correct_n * 5;
    else
      -- speedrun: first 3 runs a day pay; exam: first 2 a day pay
      select count(*) into runs_today from quiz_attempts
      where user_id = att.user_id and quiz_id = qz.id and finished_at is not null and not flagged
        and (finished_at at time zone 'Indian/Mauritius')::date = today_local();
      if runs_today < (case when qz.kind = 'exam' then 2 else 3 end) then xp_base := round(qz.xp_reward * frac); end if;
    end if;

    -- mistakes deck
    for r in
      select qid, (p_answers->>(qid::text)) is not null and (p_answers->>(qid::text))::int = k.correct as ok
      from unnest(att.question_ids) qid join question_keys k on k.question_id = qid
    loop
      if not r.ok then
        insert into review_items(user_id, question_id, course_id, box, due_at)
        values (att.user_id, r.qid, qz.course_id, 0, now() + interval '1 day')
        on conflict (user_id, question_id) do update
          set box = 0, due_at = now() + interval '1 day', times_wrong = review_items.times_wrong + 1, updated_at = now();
        added := added + 1;
      elsif qz.kind = 'review' then
        update review_items set box = box + 1, updated_at = now(),
          due_at = now() + case box when 0 then interval '3 days' else interval '7 days' end
        where user_id = att.user_id and question_id = r.qid;
        delete from review_items where user_id = att.user_id and question_id = r.qid and box >= 3;
        if found then mastered := mastered + 1; end if;
      end if;
    end loop;
  end if;

  select exists(select 1 from quiz_attempts where user_id = att.user_id and quiz_id = qz.id
      and finished_at is not null and not flagged and score * 2 >= total
      and (finished_at at time zone 'Indian/Mauritius')::date = today_local()) into passed_today;

  update quiz_attempts set finished_at = now(), score = correct_n, total = n, time_ms = elapsed,
    points = pts, flagged = is_flagged, answers = p_answers, focus_lost = greatest(0, least(coalesce(p_focus_lost, 0), 999))
  where id = att.id;

  res := award_xp(att.user_id, xp_base, 'quiz', qz.id::text, crs.tier, case when xp_base > 0 then 5 else 0 end, true);
  update quiz_attempts set xp_awarded = coalesce((res->>'xp')::int, 0) where id = att.id;

  if not is_flagged and frac >= 0.5 and not passed_today then
    perform bump_challenge(att.user_id, 'quiz_pass', 1, null);
    perform bump_challenge(att.user_id, 'quiz_specific', 1, qz.id);
  end if;
  perform check_achievements(att.user_id);

  return jsonb_build_object('score', correct_n, 'total', n, 'points', pts, 'time_ms', elapsed,
    'flagged', is_flagged, 'xp', coalesce((res->>'xp')::int, 0), 'multiplier', res->'multiplier',
    'leveled_up', coalesce((res->>'leveled_up')::boolean, false), 'level_after', res->'level_after',
    'review_added', added, 'review_mastered', mastered, 'results', results);
end $$;

-- ================================================================ new avatar slots for shop items
alter table shop_items drop constraint if exists shop_items_kind_check;
alter table shop_items add constraint shop_items_kind_check check (kind in ('title', 'name_style', 'frame', 'hat', 'pattern', 'streak_freeze', 'face_acc', 'back'));

create or replace function equip_item(p_kind text, p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_kind not in ('title', 'name_style', 'frame', 'hat', 'pattern', 'face_acc', 'back') then raise exception 'bad kind'; end if;
  if p_code is not null then
    select s.* into it from shop_items s
    where s.code = p_code and s.kind = p_kind
      and ((s.tutor_only and is_tutor())
           or exists (select 1 from user_items u where u.item_id = s.id and u.user_id = auth.uid()));
    if not found then raise exception 'you do not own this'; end if;
  end if;
  if p_kind = 'title' then update profiles set title = it.data->>'text' where id = auth.uid();
  elsif p_kind = 'name_style' then update profiles set name_style = p_code where id = auth.uid();
  elsif p_kind = 'frame' then update profiles set frame = p_code where id = auth.uid();
  else update profiles set blocky = blocky || jsonb_build_object(p_kind, coalesce(p_code, 'none')) where id = auth.uid();
  end if;
end $$;

-- ================================================================ realtime for the new live features
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['chat_messages', 'friendships', 'parties', 'party_members', 'party_invites'] loop
      begin
        execute format('alter publication supabase_realtime add table %I', t);
      exception when duplicate_object then null;
      end;
    end loop;
  end if;
end $$;

-- shop catalogue (new pixel items)
begin;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('11053d12-9378-5027-af7f-c4823c3acf1b', 'beanie', 'hat', 'Cosy Beanie', 'Warm head, cool vibes.', 150, 'common', 1, '{}'::jsonb, 0, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('45f4ba79-f986-59b0-a6e1-9846e8f0434f', 'party', 'hat', 'Party Hat', 'Every quiz is a celebration.', 150, 'common', 1, '{}'::jsonb, 1, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('e544811e-e8d4-5bd4-a4cd-3d135f6835ab', 'cowboy', 'hat', 'Cowboy Hat', 'Yeehaw, ledgers.', 200, 'common', 1, '{}'::jsonb, 2, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('ddf770bf-9596-54c3-a84b-506fc82382d3', 'chef', 'hat', 'Chef''s Toque', 'Cooking up A*s.', 200, 'common', 1, '{}'::jsonb, 3, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('5aa124b8-d498-51ec-a0b4-0f832585cd20', 'wizard', 'hat', 'Wizard Hat', 'Turns MCQs into magic.', 300, 'rare', 3, '{}'::jsonb, 4, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('278cbaf5-268f-58b8-a562-8a4c9d2699b9', 'ninja', 'hat', 'Ninja Band', 'Silent. Fast. Correct.', 350, 'rare', 4, '{}'::jsonb, 5, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('2b300e4e-8950-50d8-ad52-625510b8c318', 'bunny', 'hat', 'Bunny Ears', 'Hop to it.', 200, 'common', 1, '{}'::jsonb, 6, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('bc67770a-d963-55e9-acec-65720900cd24', 'mushroom', 'hat', 'Mushroom Cap', 'Fun guy.', 200, 'common', 1, '{}'::jsonb, 7, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('05b75ee7-7f49-5d52-af4b-167f30c533d1', 'tricorn', 'hat', 'Pirate Tricorn', 'Plunder those marks.', 300, 'rare', 1, '{}'::jsonb, 8, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('bc396879-4be3-5bd5-aa31-c9e1672a6b67', 'horns', 'hat', 'Fire Horns', 'Too hot to handle.', 400, 'rare', 3, '{}'::jsonb, 9, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('1cef7021-202f-579b-af31-fbe70a994158', 'neon_phones', 'hat', 'Neon Headphones', 'Lo-fi beats to revise to.', 400, 'rare', 3, '{}'::jsonb, 10, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('e549e282-99bd-58c9-a821-db529e6fec55', 'fedora', 'hat', 'Sparkle Fedora', 'Classy and a little shiny.', 650, 'epic', 6, '{}'::jsonb, 11, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('55955db5-514d-59c3-a981-435211512d97', 'frost_crown', 'hat', 'Frost Crown', 'Ice cold under pressure.', 700, 'epic', 7, '{}'::jsonb, 12, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('6cd82a24-63cf-5d52-aed5-4c944e5f564c', 'kabuto', 'hat', 'Samurai Kabuto', 'Discipline. Focus. A*.', 750, 'epic', 7, '{}'::jsonb, 13, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('c859b924-beb9-5f46-a9d2-e09e69e04e9e', 'astronaut', 'hat', 'Astronaut Helmet', 'Grades to the moon.', 1100, 'legendary', 10, '{}'::jsonb, 14, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('39154f84-186a-50d4-a772-f62cc21c88cf', 'nerd', 'face_acc', 'Nerd Glasses', 'Big brain energy.', 150, 'common', 1, '{}'::jsonb, 15, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('41719708-1280-5aa3-a268-db59498ae6db', 'eyepatch', 'face_acc', 'Eye Patch', 'Arr.', 150, 'common', 1, '{}'::jsonb, 16, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('04013099-3c99-5d08-a3aa-8c6d6c8adb1d', 'shades', 'face_acc', 'Pixel Shades', 'Too cool for revision (not really).', 250, 'common', 1, '{}'::jsonb, 17, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('3a676882-3719-52b6-abc0-dcbf2cc80281', 'monocle', 'face_acc', 'Gold Monocle', 'Indeed.', 300, 'rare', 3, '{}'::jsonb, 18, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('a40610dc-b15c-5531-a17d-4a459cde8aca', 'laser_visor', 'face_acc', 'Laser Visor', 'Scans questions instantly.', 650, 'epic', 6, '{}'::jsonb, 19, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('8f4d85c9-8b0e-5f0b-a150-c09ae49967d1', 'cape', 'back', 'Hero Cape', 'Not all heroes wear capes. You do.', 350, 'rare', 1, '{}'::jsonb, 20, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('f130ad0c-2ead-5acf-aafc-dc8e930aa08c', 'blade', 'back', 'Blocky Blade', 'For slicing through past papers.', 400, 'rare', 3, '{}'::jsonb, 21, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('3769abeb-b178-5622-aa13-0f6848013231', 'butterfly', 'back', 'Butterfly Wings', 'Float like one.', 450, 'rare', 4, '{}'::jsonb, 22, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('b3cfd743-547c-537c-aedd-1162c6fdccc4', 'angel_wings', 'back', 'Angel Wings', 'Heavenly marks.', 750, 'epic', 7, '{}'::jsonb, 23, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('01121d9e-7008-597f-ae80-37335d4b756c', 'demon_wings', 'back', 'Demon Wings', 'Exam season mode.', 800, 'epic', 8, '{}'::jsonb, 24, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('82fbb2f8-a17d-5d97-a41f-ff7fb76063c9', 'jetpack', 'back', 'Jetpack', 'Fastest way up the leaderboard.', 1000, 'legendary', 10, '{}'::jsonb, 25, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('a9c311a4-49b2-525a-a789-3e9ccd41b5f5', 'shadow_aura', 'back', 'Shadow Aura', 'The final boss of the class.', 1300, 'legendary', 12, '{}'::jsonb, 26, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('f641996e-bbaf-5e45-a3ff-063884ee1b82', 'stars', 'pattern', 'Starry', 'Sparkly background.', 150, 'common', 1, '{}'::jsonb, 27, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('1761cea6-5779-5a92-a0c5-75563a3e120e', 'checker', 'pattern', 'Checkerboard', 'Retro squares.', 150, 'common', 1, '{}'::jsonb, 28, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('30b766fc-6d72-59cb-a7f3-3f3faa72217a', 'stripes', 'pattern', 'Speed Stripes', 'Looks fast, is fast.', 150, 'common', 1, '{}'::jsonb, 29, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('1f361502-b776-56d2-a1c1-66881936b103', 'grass', 'pattern', 'Grass Block', 'Touch grass (digitally).', 250, 'rare', 1, '{}'::jsonb, 30, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('8f8a5c10-fd38-56f9-abf9-e4338b203284', 'galaxy', 'pattern', 'Galaxy', 'Big brain, bigger universe.', 450, 'epic', 5, '{}'::jsonb, 31, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('b2392864-ee59-5a3c-a209-5fde6a8f07cf', 'bronze', 'frame', 'Bronze Frame', null, 200, 'common', 1, '{}'::jsonb, 32, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('10ae4002-efcb-50ff-a921-5302cda370fb', 'silver', 'frame', 'Silver Frame', null, 350, 'rare', 3, '{}'::jsonb, 33, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('bdc7fb76-a241-5ba0-a48e-2814a04a1db9', 'fire', 'frame', 'Fire Frame', 'On a streak? Show it.', 600, 'epic', 6, '{}'::jsonb, 34, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('3b101bec-55c4-565a-aab8-213157cdbe58', 'gold', 'frame', 'Gold Frame', null, 700, 'epic', 8, '{}'::jsonb, 35, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('e54b56b9-a1b0-5173-aad1-f859af9b010a', 'diamond', 'frame', 'Diamond Frame', null, 1200, 'legendary', 12, '{}'::jsonb, 36, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('48de8694-b5eb-565f-a8c3-def69d4c172a', 'ocean', 'name_style', 'Ocean Blue', null, 150, 'common', 1, '{}'::jsonb, 37, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('d62d0d18-6f98-5b6b-a912-dcf49d13df02', 'lime', 'name_style', 'Lime Green', null, 150, 'common', 1, '{}'::jsonb, 38, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('721c7a0a-4743-5963-a050-9fe0993b40fe', 'sunset', 'name_style', 'Sunset', null, 350, 'rare', 3, '{}'::jsonb, 39, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('cb3b880d-653d-512e-a2d0-3b740bf639a3', 'gold', 'name_style', 'Golden Name', null, 600, 'epic', 6, '{}'::jsonb, 40, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('9732de00-d083-5947-ab5a-356f11207072', 'rainbow', 'name_style', 'Rainbow', null, 1000, 'legendary', 10, '{}'::jsonb, 41, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('f157a991-062b-5e98-a6f6-53cc8af0798c', 't-ledger', 'title', 'Ledger Legend', null, 120, 'common', 1, '{"text":"Ledger Legend"}'::jsonb, 42, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('d3e78f72-de2b-551b-a873-a9a0ab6c068f', 't-demand', 'title', 'Supply & Demand Slayer', null, 120, 'common', 1, '{"text":"Supply & Demand Slayer"}'::jsonb, 43, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('84ddea8a-b10e-59c2-a668-3bc4c4486dbb', 't-binary', 'title', 'Binary Boss', null, 120, 'common', 1, '{"text":"Binary Boss"}'::jsonb, 44, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('b6ce96a8-f94c-5dc6-a7ff-bd786ed43cef', 't-tycoon', 'title', 'Business Tycoon', null, 120, 'common', 1, '{"text":"Business Tycoon"}'::jsonb, 45, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('4148642b-3bb3-5389-a953-e03a54742aca', 't-exam', 'title', 'Exam Destroyer', null, 300, 'rare', 5, '{"text":"Exam Destroyer"}'::jsonb, 46, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('bea6220d-0fdc-5c63-ade8-25c6bd55a73b', 't-comeback', 'title', 'The Comeback Kid', null, 500, 'epic', 8, '{"text":"The Comeback Kid"}'::jsonb, 47, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('f2b34abd-2c68-5717-acc3-e75886650e97', 'owner_crown', 'hat', 'Owner Crown', 'Owner exclusive.', 0, 'legendary', 1, '{}'::jsonb, 48, true) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('ef26b78a-2652-59c9-a40b-119658c04216', 'owner', 'pattern', 'Throne Room', 'Owner exclusive.', 0, 'legendary', 1, '{}'::jsonb, 49, true) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('a8217d6f-7262-5f2a-aa0b-f8faa1b4a394', 'owner', 'frame', 'Owner Frame', 'Owner exclusive. It spins.', 0, 'legendary', 1, '{}'::jsonb, 50, true) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('a0bb9d5a-692f-5079-a837-030925d90c4b', 'owner', 'name_style', 'Owner Name', 'Owner exclusive, with a 👑 tag.', 0, 'legendary', 1, '{}'::jsonb, 51, true) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('d48e35de-3256-52f7-a5b7-f52fd4e10d46', 't-owner', 'title', 'Owner', 'Owner exclusive.', 0, 'legendary', 1, '{"text":"👑 Owner"}'::jsonb, 52, true) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort, tutor_only) values ('823bfdae-052d-5d16-a8f2-a0f072d6bfc8', 'streak-freeze', 'streak_freeze', 'Streak Freeze', 'Saves your streak if you miss a day. Hold up to 2.', 80, 'rare', 1, '{}'::jsonb, 53, false) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort, tutor_only = excluded.tutor_only;
commit;
