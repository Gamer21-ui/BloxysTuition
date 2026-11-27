-- ⚡ Order Race: an arcade battle where each round is "put these in the right order" (e.g. PC → MAR → MDR → CIR).
-- Fastest correct order scores most. Challenge someone in chat like a normal battle.

alter table questions drop constraint if exists questions_source_check;
alter table questions add constraint questions_source_check check (source in ('quiz', 'paper', 'order'));
alter table question_keys add column if not exists order_key int[];      -- option indexes in the correct order
alter table battle_answers add column if not exists order_given int[];
alter table battles drop constraint if exists battles_style_check;
alter table battles add constraint battles_style_check check (style in ('classic', 'ranked', 'pressure', 'duel', 'race'));
alter table chat_messages add column if not exists style text;

create or replace function create_battle(p_mode text, p_course uuid default null, p_rounds int default 5, p_tier tier default null,
                                         p_subject text default null, p_both boolean default false, p_chapter uuid default null,
                                         p_style text default 'classic')
returns text language plpgsql security definer set search_path = public as $$
declare c text; b uuid; lvl tier; subj text := nullif(btrim(coalesce(p_subject, '')), ''); both_lv boolean := coalesce(p_both, false);
        crs uuid := p_course; chap uuid := p_chapter; sty text := coalesce(p_style, 'classic'); rounds int; secs int := 20; ch chapters%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_mode not in ('1v1','2v2') then raise exception 'bad mode'; end if;
  if sty not in ('classic', 'ranked', 'pressure', 'duel', 'race') then raise exception 'bad style'; end if;
  if sty = 'ranked' then chap := null; end if;          -- ranked covers a whole subject or level, not one easy chapter
  rounds := least(greatest(coalesce(p_rounds, 5), 3), 10);
  if sty = 'ranked' then rounds := greatest(rounds, 5); end if;
  if sty = 'duel' then
    if p_mode <> '1v1' then raise exception 'duels are 1v1'; end if;
    select * into ch from chapters where id = chap;
    if not found then raise exception 'pick a chapter for the duel'; end if;
    if not is_tutor() and not (ch.duel_open and is_live(ch.status, ch.release_at)) then
      raise exception 'duels are not open for this chapter yet';
    end if;
    rounds := case when coalesce(p_rounds, 5) >= 7 then 7 else 5 end;
    if (select count(*) from questions where chapter_id = chap and source = 'paper') < rounds then
      raise exception 'not enough past-paper questions for this chapter yet';
    end if;
    secs := 35;                                           -- exam questions need reading time
  elsif sty = 'race' then
    if p_course is null and chap is null then raise exception 'pick a subject for the race'; end if;
    rounds := least(greatest(coalesce(p_rounds, 5), 3), 7);
    if (select count(*) from questions where source = 'order'
          and (case when chap is not null then chapter_id = chap else course_id = p_course end)) < 3 then
      raise exception 'no Order Race puzzles for this topic yet';
    end if;
    if chap is not null and not is_tutor() and not exists (select 1 from chapters where id = chap and is_live(status, release_at)) then
      raise exception 'chapter locked';
    end if;
    secs := 30;
  end if;
  if chap is not null then
    select course_id into crs from chapters where id = chap;
    if crs is null then raise exception 'chapter not found'; end if;
  end if;
  if crs is not null then
    subj := null; both_lv := false;
    select tier into lvl from courses where id = crs;
  else
    lvl := case when both_lv then 'A'::tier else coalesce(p_tier, (select tier from profiles where id = auth.uid())) end;
    if lvl = 'O' then both_lv := false; end if;
    if subj is not null and not exists (
        select 1 from courses cc where cc.active and subject_of(cc.slug) = subj
          and (cc.tier = lvl or (both_lv and cc.tier = 'AS'))) then
      raise exception 'no such subject at that level';
    end if;
  end if;
  loop
    c := upper(substr(md5(random()::text), 1, 5));
    exit when not exists (select 1 from battles where code = c);
  end loop;
  insert into battles(code, mode, course_id, chapter_id, host_id, round_count, round_seconds, tier, subject, both_levels, style)
  values (c, p_mode, crs, chap, auth.uid(), rounds, secs, lvl, subj, both_lv, sty)
  returning id into b;
  insert into battle_players(battle_id, user_id, team) values (b, auth.uid(), 1);
  if sty not in ('duel', 'race') then perform bring_party(b, 1); end if;
  return c;
end $$;
revoke all on function create_battle(text, uuid, int, tier, text, boolean, uuid, text) from public, anon;
grant execute on function create_battle(text, uuid, int, tier, text, boolean, uuid, text) to authenticated;

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
    where (case when b.style = 'duel' then qq.chapter_id = b.chapter_id and qq.source = 'paper'
                when b.style = 'race' then qq.source = 'order' and (case when b.chapter_id is not null then qq.chapter_id = b.chapter_id
                     else qq.course_id = b.course_id and exists (select 1 from chapters c2 where c2.id = qq.chapter_id and is_live(c2.status, c2.release_at)) end)
                else qq.battle_ok and qq.source = 'quiz' and
                  (case when b.chapter_id is not null then qq.chapter_id = b.chapter_id
                        when b.course_id is not null then qq.course_id = b.course_id
                        else (b.tier is null or cc.tier = b.tier or (b.both_levels and cc.tier = 'AS'))
                             and (b.subject is null or subject_of(cc.slug) = b.subject) end) end)
    order by random() limit b.round_count
  loop
    i := i + 1;
    insert into battle_rounds(battle_id, round_no, question_id) values (b.id, i, q);
  end loop;
  if i = 0 then raise exception 'no questions available for this level yet'; end if;
  update battles set status = 'live', round_count = i, current_round = 1, phase = 'question',
    phase_started_at = now() where id = b.id;
end $$;

create or replace function battle_question(p_battle uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('round', r.round_no, 'id', q.id, 'prompt', q.prompt, 'options', q.options, 'correct', r.correct,
           'ref', q.ref,
           'guide', case when r.correct is not null then k.guide end,
           'explanation', case when r.correct is not null and b.style in ('duel', 'race') then q.explanation end,
           'order', case when r.correct is not null and b.style = 'race' then to_jsonb(k.order_key) end)
  from battles b join battle_rounds r on r.battle_id = b.id and r.round_no = b.current_round
  join questions q on q.id = r.question_id
  left join question_keys k on k.question_id = q.id
  where b.id = p_battle and exists(select 1 from battle_players p where p.battle_id = b.id and p.user_id = auth.uid());
$$;

create or replace function tick_battle(p_battle uuid) returns text
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype;
begin
  select * into b from battles where id = p_battle for update;
  if not found or b.status <> 'live' then return coalesce(b.status, 'missing'); end if;
  if not exists(select 1 from battle_players where battle_id = b.id and user_id = auth.uid()) then
    return b.status;
  end if;
  if b.phase = 'question' and now() > coalesce(b.phase_ends_at, b.phase_started_at + make_interval(secs => b.round_seconds)) + interval '1 second' then
    perform battle_reveal(b.id);
  elsif b.phase = 'reveal' and now() > b.phase_started_at + (case b.style when 'duel' then interval '12 seconds' when 'race' then interval '7 seconds' else interval '5 seconds' end) then
    if b.current_round >= b.round_count then
      perform battle_finish(b.id);
      return 'finished';
    end if;
    update battles set current_round = current_round + 1, phase = 'question', phase_started_at = now(), phase_ends_at = null where id = b.id;
  end if;
  return 'live';
end $$;

create or replace function battle_finish(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; s1 int; s2 int; w int; pl record; c courses%rowtype; played_today int; nplayers int;
        r1 numeric; r2 numeric; e1 numeric; res1 numeric; d int; k int; repeats int; nright int; amt int; res jsonb;
begin
  select * into b from battles where id = p_battle for update;
  select coalesce(sum(score) filter (where team = 1), 0), coalesce(sum(score) filter (where team = 2), 0), count(*)
    into s1, s2, nplayers from battle_players where battle_id = b.id;
  w := case when s1 > s2 then 1 when s2 > s1 then 2 else 0 end;
  update battles set status = 'finished', winner_team = w where id = b.id;
  if b.rewarded then return; end if;
  update battles set rewarded = true where id = b.id;
  select * into c from courses where id = b.course_id;

  if b.style = 'race' then
    for pl in select * from battle_players where battle_id = b.id loop
      select count(*) into played_today from xp_events
        where user_id = pl.user_id and reason = 'race' and (created_at at time zone 'Indian/Mauritius')::date = today_local();
      if nplayers >= 2 and played_today < 5 then
        res := award_xp(pl.user_id, case when w = 0 then 35 when w = pl.team then 60 else 20 end,
                        'race', b.id::text, c.tier, case when w = pl.team then 10 else 3 end, true);
        update battle_players set reward_xp = coalesce((res->>'xp')::int, 0) where battle_id = b.id and user_id = pl.user_id;
      end if;
      perform bump_challenge(pl.user_id, 'battle_play', 1, null);
      if w = pl.team then perform bump_challenge(pl.user_id, 'battle_win', 1, null); end if;
      perform check_achievements(pl.user_id);
    end loop;
    return;
  end if;

  if b.style = 'duel' then
    for pl in select * from battle_players where battle_id = b.id loop
      select count(*) into nright from battle_answers where battle_id = b.id and user_id = pl.user_id and correct;
      -- anti-farming: 5 rewarded duels a day, and only 3 a day against the same opponent count
      select count(*) into played_today from xp_events
        where user_id = pl.user_id and reason = 'duel' and (created_at at time zone 'Indian/Mauritius')::date = today_local();
      select count(*) into repeats from battles ob join battle_players me on me.battle_id = ob.id and me.user_id = pl.user_id
      where ob.style = 'duel' and ob.status = 'finished' and ob.id <> b.id and me.duel_counted
        and (ob.created_at at time zone 'Indian/Mauritius')::date = today_local()
        and exists (select 1 from battle_players o join battle_players cur on cur.user_id = o.user_id and cur.battle_id = b.id and cur.team <> pl.team
                    where o.battle_id = ob.id and o.team <> me.team);
      if nplayers = 2 and repeats < 3 then
        update battle_players set duel_counted = true where battle_id = b.id and user_id = pl.user_id;
        if played_today < 5 then
          -- 15 XP per correct answer; the winner's is doubled plus a 50 XP bonus; a draw adds 20
          amt := case when w = pl.team then nright * 30 + 50 when w = 0 then nright * 15 + 20 else nright * 15 end;
          res := award_xp(pl.user_id, amt, 'duel', b.id::text, c.tier, case when w = pl.team then 20 when w = 0 then 8 else 5 end, true);
          update battle_players set reward_xp = coalesce((res->>'xp')::int, 0) where battle_id = b.id and user_id = pl.user_id;
        end if;
      end if;
      perform bump_challenge(pl.user_id, 'battle_play', 1, null);
      if w = pl.team then perform bump_challenge(pl.user_id, 'battle_win', 1, null); end if;
      perform check_achievements(pl.user_id);
    end loop;
    return;
  end if;

  for pl in select * from battle_players where battle_id = b.id loop
    select count(*) into played_today from xp_events
      where user_id = pl.user_id and reason = 'battle' and (created_at at time zone 'Indian/Mauritius')::date = today_local();
    if nplayers >= 2 and played_today < 5 then
      res := award_xp(pl.user_id, case when w = 0 then 35 when w = pl.team then 60 else 20 end,
                      'battle', b.id::text, c.tier, case when w = pl.team then 10 else 3 end, true);
      update battle_players set reward_xp = coalesce((res->>'xp')::int, 0) where battle_id = b.id and user_id = pl.user_id;
    end if;
    perform bump_challenge(pl.user_id, 'battle_play', 1, null);
    if w = pl.team then perform bump_challenge(pl.user_id, 'battle_win', 1, null); end if;
    perform check_achievements(pl.user_id);
  end loop;

  -- ranked: Elo on team averages. Students only; tutors play unrated.
  if b.style = 'ranked' and exists (select 1 from battle_players where battle_id = b.id and team = 1)
     and exists (select 1 from battle_players where battle_id = b.id and team = 2) then
    select avg(p.rating) filter (where bp.team = 1), avg(p.rating) filter (where bp.team = 2) into r1, r2
    from battle_players bp join profiles p on p.id = bp.user_id where bp.battle_id = b.id;
    e1 := 1 / (1 + power(10, (r2 - r1) / 400));
    res1 := case w when 1 then 1 when 2 then 0 else 0.5 end;
    for pl in select bp.*, p.ranked_played, p.role from battle_players bp join profiles p on p.id = bp.user_id where bp.battle_id = b.id loop
      if pl.role <> 'student' then continue; end if;
      k := case when pl.ranked_played < 10 then 40 else 28 end;           -- placement games move faster
      d := round(k * (case when pl.team = 1 then res1 - e1 else (1 - res1) - (1 - e1) end));
      -- anti-farming: after 3 ranked games today against the same opponent(s), no more rating changes
      select count(*) into repeats from battles ob join battle_players me on me.battle_id = ob.id and me.user_id = pl.user_id
      where ob.style = 'ranked' and ob.status = 'finished' and ob.id <> b.id
        and (ob.created_at at time zone 'Indian/Mauritius')::date = today_local()
        and exists (select 1 from battle_players o join battle_players cur on cur.user_id = o.user_id and cur.battle_id = b.id and cur.team <> pl.team
                    where o.battle_id = ob.id and o.team <> me.team);
      if repeats >= 3 then d := 0; end if;
      update profiles set rating = greatest(0, rating + d), ranked_played = ranked_played + 1,
        ranked_wins = ranked_wins + case when w = pl.team then 1 else 0 end where id = pl.user_id;
      update battle_players set rating_delta = d where battle_id = b.id and user_id = pl.user_id;
    end loop;
  end if;
end $$;
revoke execute on function battle_finish(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- normal answers can't be sent to a race (and the reverse)
create or replace function answer_battle(p_battle uuid, p_choice int) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; k int; elapsed int; pts int := 0; ok boolean; deadline timestamptz; left_s numeric;
begin
  select * into b from battles where id = p_battle for update;
  if b.style = 'race' then raise exception 'send an order for race rounds'; end if;
  if b.status <> 'live' or b.phase <> 'question' then raise exception 'not accepting answers'; end if;
  if not exists(select 1 from battle_players where battle_id = b.id and user_id = auth.uid()) then
    raise exception 'not in this battle';
  end if;
  deadline := coalesce(b.phase_ends_at, b.phase_started_at + make_interval(secs => b.round_seconds));
  if now() > deadline + interval '1 second' then raise exception 'too late'; end if;
  elapsed := (extract(epoch from (now() - b.phase_started_at)) * 1000)::int;
  select qk.correct into k from battle_rounds r join question_keys qk on qk.question_id = r.question_id
  where r.battle_id = b.id and r.round_no = b.current_round;
  ok := p_choice = k;
  if ok then pts := 100 + greatest(0, round(100 * (1 - elapsed::numeric / (b.round_seconds * 1000))))::int; end if;
  insert into battle_answers(battle_id, round_no, user_id, choice, correct, ms, points)
  values (b.id, b.current_round, auth.uid(), p_choice, ok, elapsed, pts)
  on conflict do nothing;
  if not found then return; end if;
  if (select count(*) from battle_answers where battle_id = b.id and round_no = b.current_round)
     >= (select count(*) from battle_players where battle_id = b.id) then
    perform battle_reveal(b.id);
  elsif b.style = 'pressure' then
    left_s := extract(epoch from (deadline - now()));
    if left_s > 3 then
      update battles set phase_ends_at = now() + make_interval(secs => greatest(3, left_s / 2)) where id = b.id;
    end if;
  end if;
end $$;

-- choice = how many items were in the right place (for the scoreboard); points only for a fully correct order
create or replace function answer_race(p_battle uuid, p_order int[]) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; key int[]; elapsed int; pts int := 0; ok boolean; placed int := 0; i int;
begin
  select * into b from battles where id = p_battle for update;
  if b.style <> 'race' then raise exception 'not a race'; end if;
  if b.status <> 'live' or b.phase <> 'question' then raise exception 'not accepting answers'; end if;
  if not exists(select 1 from battle_players where battle_id = b.id and user_id = auth.uid()) then
    raise exception 'not in this battle';
  end if;
  if now() > b.phase_started_at + make_interval(secs => b.round_seconds) + interval '1 second' then raise exception 'too late'; end if;
  elapsed := (extract(epoch from (now() - b.phase_started_at)) * 1000)::int;
  select qk.order_key into key from battle_rounds r join question_keys qk on qk.question_id = r.question_id
  where r.battle_id = b.id and r.round_no = b.current_round;
  if p_order is null or cardinality(p_order) <> cardinality(key) then raise exception 'place every item'; end if;
  for i in 1..cardinality(key) loop
    if p_order[i] = key[i] then placed := placed + 1; end if;
  end loop;
  ok := placed = cardinality(key);
  if ok then pts := 100 + greatest(0, round(100 * (1 - elapsed::numeric / (b.round_seconds * 1000))))::int; end if;
  insert into battle_answers(battle_id, round_no, user_id, choice, correct, ms, points, order_given)
  values (b.id, b.current_round, auth.uid(), placed, ok, elapsed, pts, p_order)
  on conflict do nothing;
  if not found then return; end if;
  if (select count(*) from battle_answers where battle_id = b.id and round_no = b.current_round)
     >= (select count(*) from battle_players where battle_id = b.id) then
    perform battle_reveal(b.id);
  end if;
end $$;
revoke all on function answer_race(uuid, int[]) from public, anon;
grant execute on function answer_race(uuid, int[]) to authenticated;

-- ---------------------------------------------------------------- chat cards say what kind of battle it is
create or replace function post_chat(p_body text, p_battle_code text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; mid bigint; body text := btrim(coalesce(p_body, '')); topic text;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if (select count(*) from chat_messages where user_id = auth.uid() and created_at > now() - interval '30 seconds') >= 6 then
    raise exception 'slow down a bit';
  end if;
  if p_battle_code is not null then
    select * into b from battles where code = upper(p_battle_code);
    if not found or b.status <> 'lobby' then raise exception 'that battle is not open'; end if;
    topic := coalesce((select title from courses where id = b.course_id),
                      case when b.both_levels then 'AS + A Level ' else '' end || coalesce(initcap(replace(b.subject, '-', ' ')), 'Mixed'));
    if b.chapter_id is not null then
      topic := topic || ' · ' || (select number || ' ' || title from chapters where id = b.chapter_id);
    end if;
    insert into chat_messages(user_id, body, kind, battle_code, mode, tier, course_title, style)
    values (auth.uid(), left(coalesce(nullif(body, ''), case b.style when 'race' then 'Race me!' when 'duel' then 'Duel me!' else 'Join my battle!' end), 500),
            'battle', b.code, b.mode, b.tier, topic, b.style)
    returning id into mid;
  else
    if body = '' then raise exception 'empty message'; end if;
    insert into chat_messages(user_id, body) values (auth.uid(), left(body, 500)) returning id into mid;
  end if;
  return mid;
end $$;

-- ---------------------------------------------------------------- exams never pick Order Race puzzles (they aren't multiple choice)
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
      where q.course_id = qz.course_id and q.source <> 'order' and (is_live(c.status, c.release_at) or is_tutor())
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

