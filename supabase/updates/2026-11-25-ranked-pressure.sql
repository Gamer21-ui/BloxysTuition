-- Ranked and Pressure battles (25 Nov 2026). Run AFTER 2026-11-25-battle-levels.sql and 2026-11-25-battle-chapter.sql.
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Battle styles: classic, ranked (rating goes up/down), pressure (every answer halves the time left).
alter table battles add column if not exists style text not null default 'classic';
alter table battles drop constraint if exists battles_style_check;
alter table battles add constraint battles_style_check check (style in ('classic', 'ranked', 'pressure'));
alter table battles add column if not exists phase_ends_at timestamptz;      -- pressure: the shortened deadline for this round
alter table battle_players add column if not exists rating_delta int;          -- ranked: rating change from this battle

alter table profiles add column if not exists rating int not null default 1000;
alter table profiles add column if not exists ranked_played int not null default 0;
alter table profiles add column if not exists ranked_wins int not null default 0;

-- ---------------------------------------------------------------- create (adds p_style)
drop function if exists create_battle(text, uuid, int, tier, text, boolean, uuid);
create or replace function create_battle(p_mode text, p_course uuid default null, p_rounds int default 5, p_tier tier default null,
                                         p_subject text default null, p_both boolean default false, p_chapter uuid default null,
                                         p_style text default 'classic')
returns text language plpgsql security definer set search_path = public as $$
declare c text; b uuid; lvl tier; subj text := nullif(btrim(coalesce(p_subject, '')), ''); both_lv boolean := coalesce(p_both, false);
        crs uuid := p_course; chap uuid := p_chapter; sty text := coalesce(p_style, 'classic'); rounds int;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_mode not in ('1v1','2v2') then raise exception 'bad mode'; end if;
  if sty not in ('classic', 'ranked', 'pressure') then raise exception 'bad style'; end if;
  if sty = 'ranked' then chap := null; end if;          -- ranked covers a whole subject or level, not one easy chapter
  rounds := least(greatest(coalesce(p_rounds, 5), 3), 10);
  if sty = 'ranked' then rounds := greatest(rounds, 5); end if;
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
  insert into battles(code, mode, course_id, chapter_id, host_id, round_count, tier, subject, both_levels, style)
  values (c, p_mode, crs, chap, auth.uid(), rounds, lvl, subj, both_lv, sty)
  returning id into b;
  insert into battle_players(battle_id, user_id, team) values (b, auth.uid(), 1);
  perform bring_party(b, 1);
  return c;
end $$;
revoke all on function create_battle(text, uuid, int, tier, text, boolean, uuid, text) from public, anon;
grant execute on function create_battle(text, uuid, int, tier, text, boolean, uuid, text) to authenticated;

-- ---------------------------------------------------------------- answers: pressure cuts the clock
create or replace function answer_battle(p_battle uuid, p_choice int) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; k int; elapsed int; pts int := 0; ok boolean; deadline timestamptz; left_s numeric;
begin
  select * into b from battles where id = p_battle for update;
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
    -- everyone else now has half the time that was left (never under 3 seconds)
    left_s := extract(epoch from (deadline - now()));
    if left_s > 3 then
      update battles set phase_ends_at = now() + make_interval(secs => greatest(3, left_s / 2)) where id = b.id;
    end if;
  end if;
end $$;

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
  elsif b.phase = 'reveal' and now() > b.phase_started_at + interval '5 seconds' then
    if b.current_round >= b.round_count then
      perform battle_finish(b.id);
      return 'finished';
    end if;
    update battles set current_round = current_round + 1, phase = 'question', phase_started_at = now(), phase_ends_at = null where id = b.id;
  end if;
  return 'live';
end $$;

-- ---------------------------------------------------------------- finish: XP as before, plus rating for ranked
create or replace function battle_finish(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; s1 int; s2 int; w int; pl record; c courses%rowtype; played_today int; nplayers int;
        r1 numeric; r2 numeric; e1 numeric; res1 numeric; d int; k int; repeats int;
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

-- ---------------------------------------------------------------- cards + leaderboard carry rating
drop function if exists profile_cards(uuid[]);
create function profile_cards(p_ids uuid[]) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, tier tier, name_style text, frame text, rating int, ranked_played int)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp), p.tier, p.name_style, p.frame, p.rating, p.ranked_played
  from profiles p where p.id = any(p_ids) and is_approved();
$$;
grant execute on function profile_cards(uuid[]) to authenticated;

create or replace function get_leaderboard(p_kind text, p_limit int default 50) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, value bigint, name_style text, frame text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp),
         case p_kind
           when 'xp' then p.xp::bigint
           when 'ranked' then p.rating::bigint
           when 'monthly' then (select coalesce(sum(amount), 0) from xp_events e where e.user_id = p.id
                                  and e.created_at >= date_trunc('month', now()))
           when 'attendance' then (select count(*) from attendance a where a.user_id = p.id and a.status in ('present','late'))
           when 'speedrun' then (select coalesce(max(q.points), 0) from quiz_attempts q join quizzes z on z.id = q.quiz_id
                                  where q.user_id = p.id and z.kind = 'speedrun' and not q.flagged)
           when 'battles' then (select count(*) from battles b join battle_players bp on bp.battle_id = b.id
                                  where bp.user_id = p.id and b.status = 'finished' and b.winner_team = bp.team)
           else 0 end as value,
         p.name_style, p.frame
  from profiles p
  where p.status = 'approved' and p.role = 'student' and is_approved() and (p_kind <> 'ranked' or p.ranked_played > 0)
  order by value desc, p.xp desc
  limit p_limit;
$$;
