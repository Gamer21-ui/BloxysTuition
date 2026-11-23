-- Exam mode (timed Paper 1 practice) and the mistakes deck (spaced review of wrong answers).

-- ---------------------------------------------------------------- quiz kinds
alter table quizzes drop constraint if exists quizzes_kind_check;
alter table quizzes add constraint quizzes_kind_check check (kind in ('quiz', 'speedrun', 'exam', 'review'));
alter table quizzes add column if not exists question_count int;   -- exams: how many questions to draw

-- ---------------------------------------------------------------- mistakes deck
-- box 0 = due 1 day after the mistake, box 1 = 3 days, box 2 = 7 days; right again in box 2 = mastered (row deleted)
create table if not exists review_items (
  user_id uuid not null references profiles(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  box int not null default 0,
  due_at timestamptz not null,
  times_wrong int not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);
create index if not exists review_due on review_items(user_id, course_id, due_at);
alter table review_items enable row level security;
drop policy if exists ri_select on review_items;
create policy ri_select on review_items for select using (user_id = auth.uid() or is_tutor());
grant select on review_items to authenticated;
grant all on review_items to service_role;

-- ---------------------------------------------------------------- start_quiz (adds exam + review)
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
  elsif qz.kind = 'exam' then
    -- random questions from every released chapter of the course
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

-- ---------------------------------------------------------------- submit_quiz (adds exam XP, review XP and the mistakes deck)
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
    'review_added', added, 'review_mastered', mastered, 'results', results);
end $$;
