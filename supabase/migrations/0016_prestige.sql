-- Prestige (like CoD): at Level 20 a student can reset their level to 1 for a Prestige emblem and rewards.
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
