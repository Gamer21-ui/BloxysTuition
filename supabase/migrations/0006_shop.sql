-- Coin shop: cosmetic items, owned items, equipped cosmetics, streak freezes.

alter table profiles add column if not exists name_style text;            -- shop item code
alter table profiles add column if not exists frame text;                 -- shop item code
alter table profiles add column if not exists streak_freezes int not null default 0;

create table if not exists shop_items (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  kind text not null check (kind in ('title', 'name_style', 'frame', 'hat', 'pattern', 'streak_freeze')),
  name text not null,
  description text,
  price int not null check (price >= 0),
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  min_level int not null default 1,
  data jsonb not null default '{}'::jsonb,     -- e.g. {"text": "Ledger Legend"} for titles
  active boolean not null default true,
  sort int not null default 0,
  unique (kind, code)
);

create table if not exists user_items (
  user_id uuid not null references profiles(id) on delete cascade,
  item_id uuid not null references shop_items(id) on delete cascade,
  acquired_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table shop_items enable row level security;
alter table user_items enable row level security;
drop policy if exists shop_select on shop_items;
create policy shop_select on shop_items for select using (is_approved() and (active or is_tutor()));
drop policy if exists ui_select on user_items;
create policy ui_select on user_items for select using (user_id = auth.uid() or is_tutor());
grant select on shop_items, user_items to authenticated;
grant all on shop_items, user_items to service_role;

-- Avatar changes now go through the server (which checks hats/backgrounds are unlocked),
-- so students can no longer write the blocky column directly.
revoke update on profiles from authenticated, anon;
grant update (display_name, theme, avatar_mode, contact) on profiles to authenticated;

-- ---------------------------------------------------------------- buy
create or replace function buy_item(p_item uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype; prof profiles%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into it from shop_items where id = p_item and active;
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

-- ---------------------------------------------------------------- equip (p_code null = take off)
create or replace function equip_item(p_kind text, p_code text) returns void
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_kind not in ('title', 'name_style', 'frame', 'hat', 'pattern') then raise exception 'bad kind'; end if;
  if p_code is not null then
    select s.* into it from shop_items s join user_items u on u.item_id = s.id and u.user_id = auth.uid()
    where s.code = p_code and s.kind = p_kind;
    if not found then raise exception 'you do not own this'; end if;
  end if;
  if p_kind = 'title' then update profiles set title = it.data->>'text' where id = auth.uid();
  elsif p_kind = 'name_style' then update profiles set name_style = p_code where id = auth.uid();
  elsif p_kind = 'frame' then update profiles set frame = p_code where id = auth.uid();
  elsif p_kind = 'hat' then update profiles set blocky = blocky || jsonb_build_object('hat', coalesce(p_code, 'none')) where id = auth.uid();
  elsif p_kind = 'pattern' then update profiles set blocky = blocky || jsonb_build_object('pattern', coalesce(p_code, 'none')) where id = auth.uid();
  end if;
end $$;

-- ---------------------------------------------------------------- streak freezes inside award_xp
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

-- ---------------------------------------------------------------- public cards now carry cosmetics
drop function if exists profile_cards(uuid[]);
create function profile_cards(p_ids uuid[]) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, tier tier, name_style text, frame text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.avatar_mode, p.discord_avatar_url, p.roblox_headshot_url, p.blocky, p.title,
         level_from_xp(p.xp), p.tier, p.name_style, p.frame
  from profiles p where p.id = any(p_ids) and is_approved();
$$;

drop function if exists get_leaderboard(text, int);
create function get_leaderboard(p_kind text, p_limit int default 50) returns table(
  id uuid, display_name text, avatar_mode text, discord_avatar_url text, roblox_headshot_url text,
  blocky jsonb, title text, level int, value bigint, name_style text, frame text)
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
           else 0 end as value,
         p.name_style, p.frame
  from profiles p
  where p.status = 'approved' and p.role = 'student' and is_approved()
  order by value desc, p.xp desc
  limit p_limit;
$$;
