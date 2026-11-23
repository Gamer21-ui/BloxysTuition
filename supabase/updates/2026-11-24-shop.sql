-- Coin shop update (24 Nov 2026). Paste into Supabase > SQL Editor > Run. Safe to run more than once.

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

-- shop catalogue
begin;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('11053d12-9378-5027-af7f-c4823c3acf1b', 'beanie', 'hat', 'Cosy Beanie', 'Warm head, cool vibes.', 150, 'common', 1, '{}'::jsonb, 0) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('45f4ba79-f986-59b0-a6e1-9846e8f0434f', 'party', 'hat', 'Party Hat', 'Every quiz is a celebration.', 150, 'common', 1, '{}'::jsonb, 1) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('e544811e-e8d4-5bd4-a4cd-3d135f6835ab', 'cowboy', 'hat', 'Cowboy Hat', 'Yeehaw, ledgers.', 200, 'common', 1, '{}'::jsonb, 2) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('ddf770bf-9596-54c3-a84b-506fc82382d3', 'chef', 'hat', 'Chef''s Toque', 'Cooking up A*s.', 200, 'common', 1, '{}'::jsonb, 3) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('5aa124b8-d498-51ec-a0b4-0f832585cd20', 'wizard', 'hat', 'Wizard Hat', 'Turns MCQs into magic.', 300, 'rare', 3, '{}'::jsonb, 4) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('278cbaf5-268f-58b8-a562-8a4c9d2699b9', 'ninja', 'hat', 'Ninja Band', 'Silent. Fast. Correct.', 350, 'rare', 4, '{}'::jsonb, 5) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('f641996e-bbaf-5e45-a3ff-063884ee1b82', 'stars', 'pattern', 'Starry', 'Sparkly background.', 150, 'common', 1, '{}'::jsonb, 6) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('1761cea6-5779-5a92-a0c5-75563a3e120e', 'checker', 'pattern', 'Checkerboard', 'Retro squares.', 150, 'common', 1, '{}'::jsonb, 7) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('30b766fc-6d72-59cb-a7f3-3f3faa72217a', 'stripes', 'pattern', 'Speed Stripes', 'Looks fast, is fast.', 150, 'common', 1, '{}'::jsonb, 8) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('1f361502-b776-56d2-a1c1-66881936b103', 'grass', 'pattern', 'Grass Block', 'Touch grass (digitally).', 250, 'rare', 1, '{}'::jsonb, 9) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('8f8a5c10-fd38-56f9-abf9-e4338b203284', 'galaxy', 'pattern', 'Galaxy', 'Big brain, bigger universe.', 450, 'epic', 5, '{}'::jsonb, 10) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('b2392864-ee59-5a3c-a209-5fde6a8f07cf', 'bronze', 'frame', 'Bronze Frame', null, 200, 'common', 1, '{}'::jsonb, 11) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('10ae4002-efcb-50ff-a921-5302cda370fb', 'silver', 'frame', 'Silver Frame', null, 350, 'rare', 3, '{}'::jsonb, 12) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('bdc7fb76-a241-5ba0-a48e-2814a04a1db9', 'fire', 'frame', 'Fire Frame', 'On a streak? Show it.', 600, 'epic', 6, '{}'::jsonb, 13) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('3b101bec-55c4-565a-aab8-213157cdbe58', 'gold', 'frame', 'Gold Frame', null, 700, 'epic', 8, '{}'::jsonb, 14) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('e54b56b9-a1b0-5173-aad1-f859af9b010a', 'diamond', 'frame', 'Diamond Frame', null, 1200, 'legendary', 12, '{}'::jsonb, 15) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('48de8694-b5eb-565f-a8c3-def69d4c172a', 'ocean', 'name_style', 'Ocean Blue', null, 150, 'common', 1, '{}'::jsonb, 16) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('d62d0d18-6f98-5b6b-a912-dcf49d13df02', 'lime', 'name_style', 'Lime Green', null, 150, 'common', 1, '{}'::jsonb, 17) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('721c7a0a-4743-5963-a050-9fe0993b40fe', 'sunset', 'name_style', 'Sunset', null, 350, 'rare', 3, '{}'::jsonb, 18) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('cb3b880d-653d-512e-a2d0-3b740bf639a3', 'gold', 'name_style', 'Golden Name', null, 600, 'epic', 6, '{}'::jsonb, 19) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('9732de00-d083-5947-ab5a-356f11207072', 'rainbow', 'name_style', 'Rainbow', null, 1000, 'legendary', 10, '{}'::jsonb, 20) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('f157a991-062b-5e98-a6f6-53cc8af0798c', 't-ledger', 'title', 'Ledger Legend', null, 120, 'common', 1, '{"text":"Ledger Legend"}'::jsonb, 21) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('d3e78f72-de2b-551b-a873-a9a0ab6c068f', 't-demand', 'title', 'Supply & Demand Slayer', null, 120, 'common', 1, '{"text":"Supply & Demand Slayer"}'::jsonb, 22) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('84ddea8a-b10e-59c2-a668-3bc4c4486dbb', 't-binary', 'title', 'Binary Boss', null, 120, 'common', 1, '{"text":"Binary Boss"}'::jsonb, 23) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('b6ce96a8-f94c-5dc6-a7ff-bd786ed43cef', 't-tycoon', 'title', 'Business Tycoon', null, 120, 'common', 1, '{"text":"Business Tycoon"}'::jsonb, 24) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('4148642b-3bb3-5389-a953-e03a54742aca', 't-exam', 'title', 'Exam Destroyer', null, 300, 'rare', 5, '{"text":"Exam Destroyer"}'::jsonb, 25) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('bea6220d-0fdc-5c63-ade8-25c6bd55a73b', 't-comeback', 'title', 'The Comeback Kid', null, 500, 'epic', 8, '{"text":"The Comeback Kid"}'::jsonb, 26) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
insert into shop_items (id, code, kind, name, description, price, rarity, min_level, data, sort) values ('823bfdae-052d-5d16-a8f2-a0f072d6bfc8', 'streak-freeze', 'streak_freeze', 'Streak Freeze', 'Saves your streak if you miss a day. Hold up to 2.', 80, 'rare', 1, '{}'::jsonb, 27) on conflict (kind, code) do update set name = excluded.name, description = excluded.description, rarity = excluded.rarity, min_level = excluded.min_level, data = excluded.data, sort = excluded.sort;
commit;
