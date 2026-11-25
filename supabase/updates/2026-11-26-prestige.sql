-- Prestige + XP boost + gentler level curve (26 Nov 2026). Run AFTER 2026-11-25-seasons.sql.
-- Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Prestige (like CoD): at Level 20 a student can reset their level to 1 for a Prestige emblem and rewards.
-- Each prestige also gives +0.15x XP on everything (P1 = 1.15x … P10 = 2.5x). Students who don't prestige keep levelling.
-- Their XP moves into lifetime_xp, so the All-time XP leaderboard still counts it. Nothing they own is lost,
-- and level unlocks stay unlocked after their first prestige.
alter table profiles add column if not exists prestige int not null default 0;
alter table profiles add column if not exists lifetime_xp bigint not null default 0;

-- unlock level for shop items/hats: once you've prestiged you keep everything up to Level 20 unlocked
create or replace function unlock_level(p_xp int, p_prestige int) returns int language sql immutable as $$
  select case when p_prestige > 0 then greatest(level_from_xp(p_xp), 20) else level_from_xp(p_xp) end;
$$;

insert into shop_items(code, kind, name, description, price, rarity, min_level, data, sort, active, reward_only)
values ('prestige', 'frame', 'Prestige Frame', 'Prestige 1 reward.', 0, 'legendary', 1, '{}'::jsonb, 910, false, true),
       ('prestige', 'name_style', 'Prestige Name', 'Prestige 5 reward.', 0, 'legendary', 1, '{}'::jsonb, 911, false, true),
       ('master', 'frame', 'Master Prestige Frame', 'Prestige 10 reward.', 0, 'legendary', 1, '{}'::jsonb, 912, false, true)
on conflict (kind, code) do update set reward_only = true, active = false;

create or replace function do_prestige() returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof profiles%rowtype; n int; v_coins int;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into prof from profiles where id = auth.uid() for update;
  if prof.role <> 'student' then raise exception 'only students can prestige'; end if;
  if prof.prestige >= 10 then raise exception 'you are already Master Prestige'; end if;
  if level_from_xp(prof.xp) < 20 then raise exception 'reach Level 20 to prestige'; end if;
  n := prof.prestige + 1;
  v_coins := 500 * n;
  update profiles set lifetime_xp = lifetime_xp + xp, xp = 0, prestige = n, coins = profiles.coins + v_coins, announced_level = 1
  where id = prof.id;
  insert into xp_events(user_id, amount, coins, reason, ref) values (prof.id, 0, v_coins, 'prestige', 'P' || n);
  perform season_give(prof.id, 'title', 'prestige-' || n, case when n = 10 then 'Master Prestige' else 'Prestige ' || n end,
                      case when n = 10 then '💠 Master Prestige' else '⭐ Prestige ' || n end);
  if n = 1 then perform season_give(prof.id, 'frame', 'prestige', 'Prestige Frame', null); end if;
  if n = 5 then perform season_give(prof.id, 'name_style', 'prestige', 'Prestige Name', null); end if;
  if n = 10 then perform season_give(prof.id, 'frame', 'master', 'Master Prestige Frame', null); end if;
  perform notify(prof.id, case when n = 10 then '💠 MASTER PRESTIGE!' else '⭐ Prestige ' || n || '!' end,
    '+' || v_coins || ' coins and new cosmetics. Equip them in the Shop!', '/shop');
  return jsonb_build_object('prestige', n, 'coins', v_coins);
end $$;
revoke all on function do_prestige() from public, anon;
grant execute on function do_prestige() to authenticated;

-- shop: level unlocks use unlock_level
create or replace function buy_item(p_item uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype; prof profiles%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into it from shop_items where id = p_item and active and not tutor_only and not reward_only;
  if not found then raise exception 'item not available'; end if;
  select * into prof from profiles where id = auth.uid() for update;
  if unlock_level(prof.xp, prof.prestige) < it.min_level then raise exception 'reach level % to unlock this', it.min_level; end if;
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

-- cards and leaderboard carry the prestige emblem; All-time XP = lifetime + current
drop function if exists profile_cards(uuid[]);
create function profile_cards(p_ids uuid[]) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, tier tier, name_style text, frame text, rating int, ranked_played int, prestige int)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp), p.tier, p.name_style, p.frame, p.rating, p.ranked_played, p.prestige
  from profiles p where p.id = any(p_ids) and is_approved();
$$;
grant execute on function profile_cards(uuid[]) to authenticated;

drop function if exists get_leaderboard(text, int);
create function get_leaderboard(p_kind text, p_limit int default 50) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, value bigint, name_style text, frame text, prestige int)
language sql stable security definer set search_path = public as $$
  with cur as (select starts_at, ends_at from seasons where status = 'active' order by number desc limit 1)
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp),
         case p_kind
           when 'xp' then p.lifetime_xp + p.xp
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
         p.name_style, p.frame, p.prestige
  from profiles p
  where p.status = 'approved' and p.role = 'student' and is_approved()
    and (p_kind <> 'ranked' or p.ranked_played > 0)
    and (p_kind <> 'season' or exists (select 1 from cur))
  order by value desc, p.xp desc
  limit p_limit;
$$;
grant execute on function get_leaderboard(text, int) to authenticated;


-- ---------------------------------------------------------------- balance: gentler level curve
-- Total XP for level L is now 40·L·(L-1) (was 50): Level 10 = 3 600, Level 20 = 15 200.
-- About 8 weeks of regular study (5 days a week, classes, quests) to reach Level 20 and prestige.
-- Everyone's level is worked out from their XP, so current students move up a little; nobody drops.
create or replace function level_from_xp(x int) returns int language sql immutable as $$
  select greatest(1, floor((1 + sqrt(1 + 4 * x / 40.0)) / 2)::int);
$$;

-- ---------------------------------------------------------------- prestige XP boost
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
  missed int;
  keeps boolean;
begin
  select * into prof from profiles where id = p_user for update;
  if not found or (p_base <= 0 and p_coins <= 0 and not p_counts_study) then
    return jsonb_build_object('xp', 0, 'leveled_up', false);
  end if;
  if p_content_tier is not null then
    mult := 1 + 0.25 * greatest(0, tier_rank(p_content_tier) - tier_rank(prof.tier));
  end if;
  mult := mult * (1 + 0.15 * coalesce(prof.prestige, 0));   -- prestige boost: +0.15x per prestige
  gained := round(greatest(p_base, 0) * mult);
  lvl_before := level_from_xp(prof.xp);

  if gained > 0 or p_coins > 0 then
    insert into xp_events(user_id, amount, coins, multiplier, reason, ref)
    values (p_user, gained, p_coins, mult, p_reason, p_ref);
    update profiles set xp = xp + gained, coins = coins + p_coins where id = p_user;
  end if;

  if p_counts_study and (prof.last_study_date is null or prof.last_study_date < today) then
    new_day := true;
    missed := case when prof.last_study_date is null then 999 else today - prof.last_study_date - 1 end;
    -- streak continues if no day was missed, or if streak freezes cover every missed day
    keeps := missed = 0 or (missed between 1 and prof.streak_freezes and prof.streak > 0);
    update profiles set
      streak = case when keeps then prof.streak + 1 else 1 end,
      best_streak = greatest(prof.best_streak, case when keeps then prof.streak + 1 else 1 end),
      streak_freezes = case when keeps and missed > 0 then prof.streak_freezes - missed else prof.streak_freezes end,
      last_study_date = today
    where id = p_user;
    if keeps and missed > 0 then
      perform notify(p_user, '🧊 Streak freeze used', 'You missed ' || missed || ' day' || case when missed > 1 then 's' else '' end
        || ', but your ' || (prof.streak + 1) || '-day streak survived.', '/shop');
    end if;
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
revoke execute on function award_xp(uuid,int,text,text,tier,int,boolean) from public, anon, authenticated;
