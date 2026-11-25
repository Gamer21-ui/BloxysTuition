-- Seasons: a leaderboard that resets each month and rewards the top players.
-- Season 1 = 1–30 December 2026 (Mauritius time). November is a warm-up and doesn't count.
-- When a season starts, ranked ratings reset to 1000. When it ends, the top 10 on Season XP and on Ranked
-- get exclusive titles, the Season frame/name style and coins, and the next season is created automatically.

-- ---------------------------------------------------------------- reward-only cosmetics (never sold, shown once owned)
alter table shop_items add column if not exists reward_only boolean not null default false;
drop policy if exists shop_select on shop_items;
create policy shop_select on shop_items for select using (
  is_approved() and (
    (active and not tutor_only and not reward_only) or is_tutor()
    or exists (select 1 from user_items u where u.item_id = shop_items.id and u.user_id = auth.uid())));

create or replace function buy_item(p_item uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype; prof profiles%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into it from shop_items where id = p_item and active and not tutor_only and not reward_only;
  if not found then raise exception 'item not available'; end if;
  select * into prof from profiles where id = auth.uid() for update;
  if level_from_xp(prof.xp) < it.min_level then raise exception 'reach level % to unlock this', it.min_level; end if;
  if prof.coins < it.price then raise exception 'not enough coins'; end if;
  if it.kind = 'streak_freeze' then
    if prof.streak_freezes >= 2 then raise exception 'you can only hold 2 streak freezes'; end if;
    update profiles set coins = coins - it.price, streak_freezes = streak_freezes + 1 where id = prof.id;
  else
    if exists (select 1 from user_items where user_id = prof.id and item_id = it.id) then raise exception 'you already own this'; end if;
    insert into user_items(user_id, item_id) values (prof.id, it.id);
    update profiles set coins = coins - it.price where id = prof.id;
  end if;
  insert into xp_events(user_id, amount, coins, reason, ref) values (prof.id, 0, -it.price, 'shop', it.code);
  return jsonb_build_object('coins', prof.coins - it.price, 'kind', it.kind, 'code', it.code);
end $$;

-- the shared season cosmetics (titles are made per season when it ends)
insert into shop_items(code, kind, name, description, price, rarity, min_level, data, sort, active, reward_only)
values ('season', 'frame', 'Season Frame', 'Top 3 of a season only.', 0, 'legendary', 1, '{}'::jsonb, 900, false, true),
       ('season', 'name_style', 'Season Champion Name', 'Season #1 only.', 0, 'legendary', 1, '{}'::jsonb, 901, false, true)
on conflict (kind, code) do update set reward_only = true, active = false;

-- ---------------------------------------------------------------- seasons
create table if not exists seasons (
  id serial primary key,
  number int unique not null,
  name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  status text not null default 'upcoming' check (status in ('upcoming', 'active', 'ended'))
);
create table if not exists season_results (
  season_id int not null references seasons(id) on delete cascade,
  board text not null check (board in ('xp', 'ranked')),
  place int not null,
  user_id uuid not null references profiles(id) on delete cascade,
  value int not null,
  primary key (season_id, board, place)
);
alter table seasons enable row level security;
alter table season_results enable row level security;
drop policy if exists seasons_select on seasons;
create policy seasons_select on seasons for select using (is_approved());
drop policy if exists season_results_select on season_results;
create policy season_results_select on season_results for select using (is_approved());
grant select on seasons, season_results to authenticated;
grant all on seasons, season_results to service_role;

insert into seasons(number, name, starts_at, ends_at)
values (1, 'Season 1', '2026-12-01 00:00:00+04', '2026-12-30 23:59:59+04')
on conflict (number) do nothing;

-- give one reward item (creating per-season titles on the fly)
create or replace function season_give(p_user uuid, p_kind text, p_code text, p_name text, p_text text) returns void
language plpgsql security definer set search_path = public as $$
declare it uuid;
begin
  insert into shop_items(code, kind, name, description, price, rarity, min_level, data, sort, active, reward_only)
  values (p_code, p_kind, p_name, 'Season reward.', 0, 'legendary', 1,
          case when p_text is null then '{}'::jsonb else jsonb_build_object('text', p_text) end, 950, false, true)
  on conflict (kind, code) do nothing;
  select id into it from shop_items where kind = p_kind and code = p_code;
  insert into user_items(user_id, item_id) values (p_user, it) on conflict do nothing;
end $$;

-- end a season: record top 10 on both boards and hand out rewards
create or replace function season_award(p_season int) returns void
language plpgsql security definer set search_path = public as $$
declare s seasons%rowtype; r record; brd text; coins int; tag text;
begin
  select * into s from seasons where id = p_season;
  if exists (select 1 from season_results where season_id = s.id) then return; end if;
  tag := 'S' || s.number;
  foreach brd in array array['xp', 'ranked'] loop
    for r in
      select x.id, x.value, row_number() over (order by x.value desc, x.xp desc) as place from (
        select p.id, p.xp,
               case brd when 'xp' then (select coalesce(sum(e.amount), 0) from xp_events e
                                        where e.user_id = p.id and e.created_at >= s.starts_at and e.created_at < s.ends_at)
                        else p.rating end::int as value
        from profiles p
        where p.role = 'student' and p.status = 'approved' and (brd <> 'ranked' or p.ranked_played > 0)) x
      where x.value > 0
      order by x.value desc, x.xp desc limit 10
    loop
      insert into season_results(season_id, board, place, user_id, value) values (s.id, brd, r.place, r.id, r.value);
      coins := case r.place when 1 then 1000 when 2 then 600 when 3 then 400 else 150 end;
      perform award_xp(r.id, 0, 'season', s.name || ' ' || brd || ' #' || r.place, null, coins, false);
      if r.place = 1 then
        perform season_give(r.id, 'title', lower(tag) || '-' || brd || '-champ', s.name || (case brd when 'xp' then ' XP Champion' else ' Ranked Champion' end),
                            case brd when 'xp' then '👑 ' || tag || ' XP Champion' else '🏆 ' || tag || ' Ranked Champion' end);
        perform season_give(r.id, 'name_style', 'season', 'Season Champion Name', null);
      end if;
      if r.place <= 3 then
        perform season_give(r.id, 'title', lower(tag) || '-top3', s.name || ' Top 3', '🥈 ' || tag || ' Top 3');
        perform season_give(r.id, 'frame', 'season', 'Season Frame', null);
      end if;
      perform season_give(r.id, 'title', lower(tag) || '-top10', s.name || ' Top 10', '⭐ ' || tag || ' Top 10');
      perform notify(r.id, '🏆 ' || s.name || ' rewards!',
        'You finished #' || r.place || ' on the ' || case brd when 'xp' then 'Season XP' else 'Ranked' end
        || ' leaderboard: +' || coins || ' coins and new cosmetics. Equip them in the Shop!', '/shop');
    end loop;
  end loop;
end $$;

-- moves seasons along; safe to call any time (the leaderboard, battles page and daily cron call it)
create or replace function season_tick() returns void
language plpgsql security definer set search_path = public as $$
declare s seasons%rowtype; nxt_start timestamptz; nxt_end timestamptz; guard int := 0;
begin
  loop
    guard := guard + 1; exit when guard > 6;
    select * into s from seasons where status = 'active' and ends_at <= now() order by number limit 1 for update skip locked;
    if found then
      perform season_award(s.id);
      update seasons set status = 'ended' where id = s.id;
      if not exists (select 1 from seasons where number = s.number + 1) then
        -- next season: from the end of this one to the end of the following month (Mauritius time)
        nxt_start := s.ends_at + interval '1 second';
        nxt_end := ((date_trunc('month', (nxt_start at time zone 'Indian/Mauritius') + interval '1 day') + interval '1 month' - interval '1 second')
                    at time zone 'Indian/Mauritius');
        if nxt_end - nxt_start < interval '20 days' then   -- too short: run to the end of the month after
          nxt_end := ((date_trunc('month', (nxt_start at time zone 'Indian/Mauritius') + interval '1 day') + interval '2 months' - interval '1 second')
                      at time zone 'Indian/Mauritius');
        end if;
        insert into seasons(number, name, starts_at, ends_at) values (s.number + 1, 'Season ' || (s.number + 1), nxt_start, nxt_end);
      end if;
      continue;
    end if;
    select * into s from seasons where status = 'upcoming' and starts_at <= now() order by number limit 1 for update skip locked;
    if found then
      update seasons set status = 'active' where id = s.id;
      update profiles set rating = 1000, ranked_played = 0, ranked_wins = 0;   -- fresh ranked ladder each season
      continue;
    end if;
    exit;
  end loop;
end $$;

-- tutor controls
create or replace function tutor_set_season(p_id int, p_starts timestamptz, p_ends timestamptz) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  if p_ends <= p_starts then raise exception 'the end must be after the start'; end if;
  update seasons set starts_at = case when status = 'upcoming' then p_starts else starts_at end, ends_at = p_ends
  where id = p_id and status <> 'ended';
end $$;
create or replace function tutor_end_season(p_id int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  update seasons set ends_at = now() where id = p_id and status = 'active';
  perform season_tick();
end $$;

revoke all on function season_give(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function season_award(int) from public, anon, authenticated;
revoke all on function season_tick() from public, anon;
grant execute on function season_tick() to authenticated, service_role;
revoke all on function tutor_set_season(int, timestamptz, timestamptz) from public, anon;
revoke all on function tutor_end_season(int) from public, anon;
grant execute on function tutor_set_season(int, timestamptz, timestamptz) to authenticated;
grant execute on function tutor_end_season(int) to authenticated;

-- ---------------------------------------------------------------- leaderboard: Season XP
create or replace function get_leaderboard(p_kind text, p_limit int default 50) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, value bigint, name_style text, frame text)
language sql stable security definer set search_path = public as $$
  with cur as (select starts_at, ends_at from seasons where status = 'active' order by number desc limit 1)
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp),
         case p_kind
           when 'xp' then p.xp::bigint
           when 'season' then (select coalesce(sum(e.amount), 0) from xp_events e, cur
                                 where e.user_id = p.id and e.created_at >= cur.starts_at and e.created_at < cur.ends_at)
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
  where p.status = 'approved' and p.role = 'student' and is_approved()
    and (p_kind <> 'ranked' or p.ranked_played > 0)
    and (p_kind <> 'season' or exists (select 1 from cur))
  order by value desc, p.xp desc
  limit p_limit;
$$;
