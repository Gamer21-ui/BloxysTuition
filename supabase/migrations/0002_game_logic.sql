-- Game logic: XP, streaks, challenges, achievements, quizzes, battles.
-- All of these run as SECURITY DEFINER so the browser can never write scores or XP directly.

-- Mauritius local "today" (streaks and daily challenges reset at local midnight)
create or replace function today_local() returns date language sql stable as $$
  select (now() at time zone 'Indian/Mauritius')::date;
$$;

create or replace function period_key(p text) returns text language sql stable as $$
  select case p
    when 'daily' then to_char(today_local(), 'YYYY-MM-DD')
    when 'weekly' then to_char(today_local(), 'IYYY-"W"IW')
    else 'once' end;
$$;

-- ---------------------------------------------------------------- new user -> profile
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  first_user boolean;
begin
  select not exists(select 1 from profiles) into first_user;
  insert into profiles (id, discord_id, discord_username, display_name, discord_avatar_url, role, status)
  values (
    new.id,
    coalesce(meta->>'provider_id', meta->>'sub'),
    coalesce(meta->'custom_claims'->>'global_name', meta->>'name', meta->>'user_name'),
    coalesce(meta->'custom_claims'->>'global_name', meta->>'full_name', meta->>'name', 'New player'),
    meta->>'avatar_url',
    case when first_user then 'tutor'::user_role else 'student'::user_role end,
    case when first_user then 'approved'::account_status else 'pending'::account_status end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------- notifications
create or replace function notify(p_user uuid, p_title text, p_body text default null, p_link text default null)
returns void language sql security definer set search_path = public as $$
  insert into notifications(user_id, title, body, link) values (p_user, p_title, p_body, p_link);
$$;

-- ---------------------------------------------------------------- XP
-- Awards XP (and coins) with the level-jump boost: +0.25x per tier the content is above the student.
create or replace function award_xp(
  p_user uuid, p_base int, p_reason text, p_ref text default null,
  p_content_tier tier default null, p_coins int default 0, p_counts_study boolean default true
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  prof profiles%rowtype;
  mult numeric := 1;
  gained int;
  lvl_before int;
  lvl_after int;
  today date := today_local();
  new_day boolean := false;
begin
  select * into prof from profiles where id = p_user for update;
  if not found or (p_base <= 0 and p_coins <= 0 and not p_counts_study) then
    return jsonb_build_object('xp', 0, 'leveled_up', false);
  end if;
  if p_content_tier is not null then
    mult := 1 + 0.25 * greatest(0, tier_rank(p_content_tier) - tier_rank(prof.tier));
  end if;
  gained := round(greatest(p_base, 0) * mult);
  lvl_before := level_from_xp(prof.xp);

  if gained > 0 or p_coins > 0 then
    insert into xp_events(user_id, amount, coins, multiplier, reason, ref)
    values (p_user, gained, p_coins, mult, p_reason, p_ref);
    update profiles set xp = xp + gained, coins = coins + p_coins where id = p_user;
  end if;

  if p_counts_study and (prof.last_study_date is null or prof.last_study_date < today) then
    new_day := true;
    update profiles set
      streak = case when prof.last_study_date = today - 1 then prof.streak + 1 else 1 end,
      best_streak = greatest(prof.best_streak, case when prof.last_study_date = today - 1 then prof.streak + 1 else 1 end),
      last_study_date = today
    where id = p_user;
  end if;

  lvl_after := level_from_xp(prof.xp + gained);
  if lvl_after > lvl_before then
    perform notify(p_user, 'Level up! You reached Lv ' || lvl_after, null, '/dashboard');
  end if;

  if p_reason <> 'challenge' and gained > 0 then
    perform bump_challenge(p_user, 'xp_earned', gained, null);
  end if;
  if new_day then
    perform bump_challenge(p_user, 'study_days', 1, null);
  end if;

  return jsonb_build_object('xp', gained, 'multiplier', mult, 'level_before', lvl_before,
                            'level_after', lvl_after, 'leveled_up', lvl_after > lvl_before);
end $$;

-- ---------------------------------------------------------------- challenges
create or replace function bump_challenge(p_user uuid, p_type text, p_amount int, p_quiz uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  c challenges%rowtype;
  k text;
  prog int;
begin
  for c in
    select * from challenges
    where active and type = p_type
      and (starts_on is null or starts_on <= today_local())
      and (ends_on is null or ends_on >= today_local())
      and (type <> 'quiz_specific' or quiz_id = p_quiz)
  loop
    k := period_key(c.period);
    insert into challenge_progress(user_id, challenge_id, period_key, progress)
    values (p_user, c.id, k, 0) on conflict do nothing;

    update challenge_progress set progress = progress + p_amount
    where user_id = p_user and challenge_id = c.id and period_key = k and completed_at is null
    returning progress into prog;

    if prog is not null and prog >= c.target then
      update challenge_progress set completed_at = now()
      where user_id = p_user and challenge_id = c.id and period_key = k;
      perform award_xp(p_user, c.xp_reward, 'challenge', c.id::text, null, c.coin_reward, false);
      perform notify(p_user, 'Challenge complete: ' || c.title, '+' || c.xp_reward || ' XP', '/challenges');
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- achievements
create or replace function check_achievements(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  a achievements%rowtype;
  prof profiles%rowtype;
  v int;
  have int;
begin
  select * into prof from profiles where id = p_user;
  for a in
    select * from achievements x where active
      and not exists (select 1 from user_achievements u where u.user_id = p_user and u.achievement_id = x.id)
  loop
    v := (a.criteria->>'value')::int;
    have := case a.criteria->>'type'
      when 'streak' then prof.best_streak
      when 'level' then level_from_xp(prof.xp)
      when 'quizzes_passed' then (select count(distinct quiz_id) from quiz_attempts
          where user_id = p_user and not flagged and total > 0 and score * 2 >= total)
      when 'perfect_quiz' then (select count(*) from quiz_attempts
          where user_id = p_user and not flagged and total > 0 and score = total)
      when 'homework' then (select count(*) from submissions where user_id = p_user)
      when 'battles_won' then (select count(*) from battles b join battle_players p on p.battle_id = b.id
          where p.user_id = p_user and b.status = 'finished' and b.winner_team = p.team)
      when 'battles_played' then (select count(*) from battles b join battle_players p on p.battle_id = b.id
          where p.user_id = p_user and b.status = 'finished')
      when 'attendance' then (select count(*) from attendance where user_id = p_user and status in ('present','late'))
      when 'speedrun_points' then (select coalesce(max(points), 0) from quiz_attempts q join quizzes z on z.id = q.quiz_id
          where q.user_id = p_user and z.kind = 'speedrun' and not q.flagged)
      else 0 end;
    if coalesce(have, 0) >= v then
      insert into user_achievements(user_id, achievement_id) values (p_user, a.id) on conflict do nothing;
      perform award_xp(p_user, a.xp_reward, 'achievement', a.code, null, 0, false);
      perform notify(p_user, 'Achievement unlocked: ' || a.title, a.description, '/achievements');
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- quizzes
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
  if qz.chapter_id is not null and not is_tutor() and not exists (
      select 1 from chapters c where c.id = qz.chapter_id and is_live(c.status, c.release_at)) then
    raise exception 'chapter locked';
  end if;

  if qz.kind = 'speedrun' then
    select array_agg(id) into ids from (
      select q.id from questions q join question_keys k on k.question_id = q.id
      where (q.quiz_id = qz.id) or (qz.chapter_id is null and q.course_id = qz.course_id and q.battle_ok)
      order by random() limit 10) s;
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

create or replace function submit_quiz(p_attempt uuid, p_answers jsonb) returns jsonb
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
      'right', (p_answers->>(q.id::text))::int = k.correct, 'explanation', q.explanation)
      order by array_position(att.question_ids, q.id))
  into results
  from questions q join question_keys k on k.question_id = q.id where q.id = any(att.question_ids);

  -- anti-cheat: nobody genuinely answers faster than ~1.2 s per question
  if elapsed < 1200 * n then is_flagged := true; end if;
  if qz.time_limit_sec is not null and elapsed > (qz.time_limit_sec + 10) * 1000 then is_flagged := true; end if;

  frac := correct_n::numeric / n;
  pts := correct_n * 100 + floor(greatest(0, n * 15000 - elapsed) / 1000.0 * 10 * frac)::int;

  if not is_flagged then
    if qz.kind = 'quiz' then
      -- only the improvement on your best score pays, so retakes can't farm XP
      select coalesce(max(score::numeric / nullif(total, 0)), 0) into prev
      from quiz_attempts where user_id = att.user_id and quiz_id = qz.id and finished_at is not null and not flagged;
      xp_base := round(qz.xp_reward * greatest(0, frac - prev));
    else
      select count(*) into runs_today from quiz_attempts
      where user_id = att.user_id and quiz_id = qz.id and finished_at is not null and not flagged
        and (finished_at at time zone 'Indian/Mauritius')::date = today_local();
      if runs_today < 3 then xp_base := round(qz.xp_reward * frac); end if;
    end if;
  end if;

  select exists(select 1 from quiz_attempts where user_id = att.user_id and quiz_id = qz.id
      and finished_at is not null and not flagged and score * 2 >= total
      and (finished_at at time zone 'Indian/Mauritius')::date = today_local()) into passed_today;

  update quiz_attempts set finished_at = now(), score = correct_n, total = n, time_ms = elapsed,
    points = pts, flagged = is_flagged, answers = p_answers
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
    'results', results);
end $$;

-- ---------------------------------------------------------------- tutor tools (called from the server with a tutor check)
create or replace function tutor_award(p_user uuid, p_xp int, p_coins int, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  r := award_xp(p_user, p_xp, 'bonus', p_reason, null, p_coins, false);
  perform notify(p_user, 'Bonus from your tutor: +' || p_xp || ' XP', p_reason, '/dashboard');
  perform check_achievements(p_user);
  return r;
end $$;

create or replace function mark_attendance(p_session uuid, p_user uuid, p_status text)
returns void language plpgsql security definer set search_path = public as $$
declare old text;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  select status into old from attendance where session_id = p_session and user_id = p_user;
  insert into attendance(session_id, user_id, status) values (p_session, p_user, p_status)
  on conflict (session_id, user_id) do update set status = excluded.status;
  if (old is null or old in ('absent','excused')) and p_status in ('present','late') then
    perform award_xp(p_user, case when p_status = 'present' then 40 else 20 end, 'attendance', p_session::text, null, 5, true);
    perform bump_challenge(p_user, 'attendance', 1, null);
    perform check_achievements(p_user);
  end if;
end $$;

create or replace function grade_submission(p_submission uuid, p_score int, p_feedback text)
returns void language plpgsql security definer set search_path = public as $$
declare s submissions%rowtype; a assignments%rowtype; c courses%rowtype; first_grade boolean;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  select * into s from submissions where id = p_submission for update;
  select * into a from assignments where id = s.assignment_id;
  select * into c from courses where id = a.course_id;
  first_grade := s.graded_at is null;
  update submissions set score = p_score, feedback = p_feedback, graded_at = now() where id = s.id;
  if first_grade then
    perform award_xp(s.user_id, round(a.xp_reward * least(1, greatest(0, p_score::numeric / a.max_score)))::int
                     + 20, 'homework', a.id::text, c.tier, 10, true);
    if a.due_at is null or s.submitted_at <= a.due_at then
      perform bump_challenge(s.user_id, 'homework_on_time', 1, null);
    end if;
    perform check_achievements(s.user_id);
  end if;
  perform notify(s.user_id, 'Marked: ' || a.title, p_score || ' / ' || a.max_score, '/homework');
end $$;

-- ---------------------------------------------------------------- leaderboards & public cards
create or replace function profile_cards(p_ids uuid[]) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, tier tier)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp), p.tier
  from profiles p where p.id = any(p_ids) and is_approved();
$$;

create or replace function get_leaderboard(p_kind text, p_limit int default 50) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, value bigint)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp),
         case p_kind
           when 'xp' then p.xp::bigint
           when 'monthly' then (select coalesce(sum(amount), 0) from xp_events e where e.user_id = p.id
                                  and e.created_at >= date_trunc('month', now()))
           when 'attendance' then (select count(*) from attendance a where a.user_id = p.id and a.status in ('present','late'))
           when 'speedrun' then (select coalesce(max(q.points), 0) from quiz_attempts q join quizzes z on z.id = q.quiz_id
                                  where q.user_id = p.id and z.kind = 'speedrun' and not q.flagged)
           when 'battles' then (select count(*) from battles b join battle_players bp on bp.battle_id = b.id
                                  where bp.user_id = p.id and b.status = 'finished' and b.winner_team = bp.team)
           else 0 end as value
  from profiles p
  where p.status = 'approved' and p.role = 'student' and is_approved()
  order by value desc, p.xp desc
  limit p_limit;
$$;

-- ---------------------------------------------------------------- battles
create or replace function create_battle(p_mode text, p_course uuid default null, p_rounds int default 5)
returns text language plpgsql security definer set search_path = public as $$
declare c text; b uuid;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_mode not in ('1v1','2v2') then raise exception 'bad mode'; end if;
  loop
    c := upper(substr(md5(random()::text), 1, 5));
    exit when not exists (select 1 from battles where code = c);
  end loop;
  insert into battles(code, mode, course_id, host_id, round_count)
  values (c, p_mode, p_course, auth.uid(), least(greatest(coalesce(p_rounds, 5), 3), 10))
  returning id into b;
  insert into battle_players(battle_id, user_id, team) values (b, auth.uid(), 1);
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
  return b.id;
end $$;

create or replace function leave_battle(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype;
begin
  select * into b from battles where id = p_battle for update;
  if b.status <> 'lobby' then raise exception 'battle already started'; end if;
  if b.host_id = auth.uid() then
    update battles set status = 'cancelled' where id = b.id;
  else
    delete from battle_players where battle_id = b.id and user_id = auth.uid();
  end if;
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
    select qq.id from questions qq join question_keys k on k.question_id = qq.id
    where qq.battle_ok and (b.course_id is null or qq.course_id = b.course_id)
    order by random() limit b.round_count
  loop
    i := i + 1;
    insert into battle_rounds(battle_id, round_no, question_id) values (b.id, i, q);
  end loop;
  if i = 0 then raise exception 'no questions available for this course'; end if;
  update battles set status = 'live', round_count = i, current_round = 1, phase = 'question',
    phase_started_at = now() where id = b.id;
end $$;

-- question for the current round (no answer key)
create or replace function battle_question(p_battle uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('round', r.round_no, 'id', q.id, 'prompt', q.prompt, 'options', q.options, 'correct', r.correct)
  from battles b join battle_rounds r on r.battle_id = b.id and r.round_no = b.current_round
  join questions q on q.id = r.question_id
  where b.id = p_battle and exists(select 1 from battle_players p where p.battle_id = b.id and p.user_id = auth.uid());
$$;

create or replace function battle_reveal(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; k int;
begin
  select * into b from battles where id = p_battle;
  select qk.correct into k from battle_rounds r join question_keys qk on qk.question_id = r.question_id
  where r.battle_id = b.id and r.round_no = b.current_round;
  update battle_rounds set correct = k where battle_id = b.id and round_no = b.current_round;
  update battle_answers set revealed = true where battle_id = b.id and round_no = b.current_round;
  update battle_players p set score = p.score + coalesce((select a.points from battle_answers a
      where a.battle_id = b.id and a.round_no = b.current_round and a.user_id = p.user_id), 0)
  where p.battle_id = b.id;
  update battles set phase = 'reveal', phase_started_at = now() where id = b.id;
end $$;

create or replace function battle_finish(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; s1 int; s2 int; w int; pl record; c courses%rowtype; played_today int; nplayers int;
begin
  select * into b from battles where id = p_battle for update;
  select coalesce(sum(score) filter (where team = 1), 0), coalesce(sum(score) filter (where team = 2), 0), count(*)
    into s1, s2, nplayers from battle_players where battle_id = b.id;
  w := case when s1 > s2 then 1 when s2 > s1 then 2 else 0 end;
  update battles set status = 'finished', winner_team = w where id = b.id;
  if b.rewarded then return; end if;
  update battles set rewarded = true where id = b.id;
  select * into c from courses where id = b.course_id;
  for pl in select * from battle_players where battle_id = b.id loop
    select count(*) into played_today from xp_events
      where user_id = pl.user_id and reason = 'battle' and (created_at at time zone 'Indian/Mauritius')::date = today_local();
    if nplayers >= 2 and played_today < 5 then
      perform award_xp(pl.user_id, case when w = 0 then 35 when w = pl.team then 60 else 20 end,
                       'battle', b.id::text, c.tier, case when w = pl.team then 10 else 3 end, true);
    end if;
    perform bump_challenge(pl.user_id, 'battle_play', 1, null);
    if w = pl.team then perform bump_challenge(pl.user_id, 'battle_win', 1, null); end if;
    perform check_achievements(pl.user_id);
  end loop;
end $$;

create or replace function answer_battle(p_battle uuid, p_choice int) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; k int; elapsed int; pts int := 0; ok boolean;
begin
  select * into b from battles where id = p_battle for update;
  if b.status <> 'live' or b.phase <> 'question' then raise exception 'not accepting answers'; end if;
  if not exists(select 1 from battle_players where battle_id = b.id and user_id = auth.uid()) then
    raise exception 'not in this battle';
  end if;
  elapsed := (extract(epoch from (now() - b.phase_started_at)) * 1000)::int;
  if elapsed > (b.round_seconds + 1) * 1000 then raise exception 'too late'; end if;
  select qk.correct into k from battle_rounds r join question_keys qk on qk.question_id = r.question_id
  where r.battle_id = b.id and r.round_no = b.current_round;
  ok := p_choice = k;
  if ok then pts := 100 + greatest(0, round(100 * (1 - elapsed::numeric / (b.round_seconds * 1000))))::int; end if;
  insert into battle_answers(battle_id, round_no, user_id, choice, correct, ms, points)
  values (b.id, b.current_round, auth.uid(), p_choice, ok, elapsed, pts)
  on conflict do nothing;
  if (select count(*) from battle_answers where battle_id = b.id and round_no = b.current_round)
     >= (select count(*) from battle_players where battle_id = b.id) then
    perform battle_reveal(b.id);
  end if;
end $$;

-- clients call this every second; it moves the battle on when timers run out
create or replace function tick_battle(p_battle uuid) returns text
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype;
begin
  select * into b from battles where id = p_battle for update;
  if not found or b.status <> 'live' then return coalesce(b.status, 'missing'); end if;
  if not exists(select 1 from battle_players where battle_id = b.id and user_id = auth.uid()) then
    return b.status;
  end if;
  if b.phase = 'question' and now() > b.phase_started_at + make_interval(secs => b.round_seconds + 1) then
    perform battle_reveal(b.id);
  elsif b.phase = 'reveal' and now() > b.phase_started_at + interval '5 seconds' then
    if b.current_round >= b.round_count then
      perform battle_finish(b.id);
      return 'finished';
    end if;
    update battles set current_round = current_round + 1, phase = 'question', phase_started_at = now() where id = b.id;
  end if;
  return 'live';
end $$;

-- ---------------------------------------------------------------- execute permissions
-- internal helpers are not callable from the browser
revoke execute on function award_xp(uuid,int,text,text,tier,int,boolean) from public, anon, authenticated;
revoke execute on function bump_challenge(uuid,text,int,uuid) from public, anon, authenticated;
revoke execute on function check_achievements(uuid) from public, anon, authenticated;
revoke execute on function notify(uuid,text,text,text) from public, anon, authenticated;
revoke execute on function battle_reveal(uuid) from public, anon, authenticated;
revoke execute on function battle_finish(uuid) from public, anon, authenticated;
revoke execute on function handle_new_user() from public, anon, authenticated;
