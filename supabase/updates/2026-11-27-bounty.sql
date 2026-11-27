-- Bounty update (27 Nov 2026): win streaks, Most Wanted and bounty rewards. Needs the Order Race update first. Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- 🎯 Bounty: win streaks in battles. Beat someone on a 3+ win streak to claim their bounty:
-- +2.5% XP per streak win (max +50%) on that win, plus a guaranteed 250 coins for every 5 wins in their streak.
-- The streaker gets +2% XP per streak win (max +20%) on every win while hot.
-- Anti-farming: a streak only grows once per opponent per day. Draws change nothing. Students only.

alter table profiles add column if not exists win_streak int not null default 0;
alter table profiles add column if not exists best_win_streak int not null default 0;

create table if not exists bounty_events (
  id bigserial primary key,
  battle_id uuid references battles(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('streak', 'claim', 'hot', 'ended')),
  other_id uuid references profiles(id) on delete set null,   -- claim: whose streak; ended: who ended it; streak: opponent
  streak int not null default 0,                              -- streak size involved
  xp int not null default 0,
  coins int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists bounty_user on bounty_events(user_id, created_at desc);
create index if not exists bounty_battle on bounty_events(battle_id);
alter table bounty_events enable row level security;
drop policy if exists bounty_select on bounty_events;
create policy bounty_select on bounty_events for select using (is_approved());
grant select on bounty_events to authenticated;
grant all on bounty_events to service_role;

-- the previous finish logic, unchanged, now called by the wrapper below
create or replace function battle_finish_inner(p_battle uuid) returns void
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
revoke execute on function battle_finish_inner(uuid) from public, anon, authenticated;

create or replace function bounty_settle(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; c courses%rowtype; wpl record; lpl record; victim record; base numeric; pct numeric; bonus int; coins int;
        grows boolean; newstreak int; res jsonb; winner_name text;
begin
  select * into b from battles where id = p_battle;
  if b.winner_team is null or b.winner_team = 0 then return; end if;            -- draws change nothing
  if (select count(distinct team) from battle_players where battle_id = b.id) < 2 then return; end if;
  select * into c from courses where id = b.course_id;

  -- the biggest streak on the losing side is the bounty (read before streaks are reset)
  select p.id, p.win_streak, p.display_name into victim
  from battle_players bp join profiles p on p.id = bp.user_id
  where bp.battle_id = b.id and bp.team <> b.winner_team and p.role = 'student'
  order by p.win_streak desc limit 1;

  for wpl in select bp.user_id, bp.reward_xp, p.win_streak, p.display_name from battle_players bp join profiles p on p.id = bp.user_id
             where bp.battle_id = b.id and bp.team = b.winner_team and p.role = 'student' loop
    -- base XP this battle paid (before multipliers), so bonuses use the same boosts
    select coalesce(sum(amount / nullif(multiplier, 0)), 0) into base from xp_events
      where user_id = wpl.user_id and ref = b.id::text and reason in ('battle', 'duel', 'race');

    -- 1) claim the bounty
    if victim.id is not null and victim.win_streak >= 3 then
      pct := least(victim.win_streak * 2.5, 50);
      bonus := round(base * pct / 100);
      coins := (victim.win_streak / 5) * 250;
      if bonus > 0 or coins > 0 then
        res := award_xp(wpl.user_id, bonus, 'bounty', b.id::text, c.tier, coins, false);
      end if;
      insert into bounty_events(battle_id, user_id, kind, other_id, streak, xp, coins)
      values (b.id, wpl.user_id, 'claim', victim.id, victim.win_streak, coalesce((res->>'xp')::int, 0), coins);
      perform notify(wpl.user_id, '🎯 Bounty claimed!', 'You ended ' || victim.display_name || '''s ' || victim.win_streak || '-win streak: +'
        || pct || '% XP' || case when coins > 0 then ' and ' || coins || ' coins' else '' end || '.', '/battles/' || b.code);
      res := null;
    end if;

    -- 2) grow the winner's streak (once per opponent per day)
    grows := exists (
      select 1 from battle_players o join profiles op on op.id = o.user_id
      where o.battle_id = b.id and o.team <> b.winner_team
        and not exists (select 1 from bounty_events e where e.user_id = wpl.user_id and e.kind = 'streak' and e.other_id = o.user_id
                          and (e.created_at at time zone 'Indian/Mauritius')::date = today_local()));
    if grows then
      newstreak := wpl.win_streak + 1;
      update profiles set win_streak = newstreak, best_win_streak = greatest(best_win_streak, newstreak) where id = wpl.user_id;
      insert into bounty_events(battle_id, user_id, kind, other_id, streak)
      select b.id, wpl.user_id, 'streak', o.user_id, newstreak from battle_players o where o.battle_id = b.id and o.team <> b.winner_team;
      -- 3) the streaker's own bonus while hot
      if newstreak >= 3 then
        pct := least(newstreak * 2, 20);
        bonus := round(base * pct / 100);
        if bonus > 0 then res := award_xp(wpl.user_id, bonus, 'streak_bonus', b.id::text, c.tier, 0, false); end if;
        insert into bounty_events(battle_id, user_id, kind, streak, xp) values (b.id, wpl.user_id, 'hot', newstreak, coalesce((res->>'xp')::int, 0));
        res := null;
        if newstreak % 5 = 0 then
          perform notify(wpl.user_id, '🔥 ' || newstreak || '-win streak!', 'There''s now a ' || (newstreak / 5) * 250
            || '-coin bounty on your head. Everyone will be gunning for you.', '/battles');
        end if;
      end if;
    end if;
  end loop;

  -- 4) the losers' streaks end
  select string_agg(p.display_name, ' & ') into winner_name from battle_players bp join profiles p on p.id = bp.user_id
    where bp.battle_id = b.id and bp.team = b.winner_team;
  for lpl in select p.id, p.win_streak from battle_players bp join profiles p on p.id = bp.user_id
             where bp.battle_id = b.id and bp.team <> b.winner_team and p.win_streak > 0 loop
    if lpl.win_streak >= 3 then
      insert into bounty_events(battle_id, user_id, kind, other_id, streak)
      values (b.id, lpl.id, 'ended', (select user_id from battle_players where battle_id = b.id and team = b.winner_team limit 1), lpl.win_streak);
      perform notify(lpl.id, '💔 Streak over', winner_name || ' ended your ' || lpl.win_streak || '-win streak and took the bounty.', '/battles/' || b.code);
    end if;
    update profiles set win_streak = 0 where id = lpl.id;
  end loop;
end $$;
revoke execute on function bounty_settle(uuid) from public, anon, authenticated;

create or replace function battle_finish(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare was boolean;
begin
  select rewarded into was from battles where id = p_battle;
  perform battle_finish_inner(p_battle);
  if not coalesce(was, true) then perform bounty_settle(p_battle); end if;   -- once per battle
end $$;
revoke execute on function battle_finish(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- streaks for the arena and the Most Wanted board
create or replace function battle_streaks(p_battle uuid) returns table(user_id uuid, win_streak int)
language sql stable security definer set search_path = public as $$
  select p.id, p.win_streak from battle_players bp join profiles p on p.id = bp.user_id
  where bp.battle_id = p_battle and is_approved();
$$;
grant execute on function battle_streaks(uuid) to authenticated;

create or replace function most_wanted(p_limit int default 5) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text, blocky jsonb,
  name_style text, frame text, tier tier, win_streak int, best_win_streak int)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.name_style, p.frame, p.tier,
         p.win_streak, p.best_win_streak
  from profiles p
  where is_approved() and p.status = 'approved' and p.role = 'student' and p.win_streak >= 3
  order by p.win_streak desc, p.best_win_streak desc
  limit least(greatest(coalesce(p_limit, 5), 1), 20);
$$;
grant execute on function most_wanted(int) to authenticated;
