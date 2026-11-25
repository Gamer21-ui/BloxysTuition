-- Power-ups (Homework Extension) and the secret Black Market (Bunk Card, Skip Homework Pass).

-- ---------------------------------------------------------------- "online" ping (lets the black market know if the owner is around)
create or replace function touch_seen() returns void
language sql security definer set search_path = public as $$
  update profiles set last_seen_at = now()
  where id = auth.uid() and (last_seen_at is null or last_seen_at < now() - interval '45 seconds');
$$;
revoke all on function touch_seen() from public, anon;
grant execute on function touch_seen() to authenticated;

-- ---------------------------------------------------------------- per-student homework changes (extensions, skips)
create table if not exists assignment_overrides (
  assignment_id uuid not null references assignments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  extra_hours int not null default 0,
  exempt boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (assignment_id, user_id)
);
alter table assignment_overrides enable row level security;
drop policy if exists overrides_select on assignment_overrides;
create policy overrides_select on assignment_overrides for select using (user_id = auth.uid() or is_tutor());
grant select on assignment_overrides to authenticated;
grant all on assignment_overrides to service_role;

-- consumable power-ups you hold
create table if not exists user_powerups (
  user_id uuid not null references profiles(id) on delete cascade,
  code text not null,
  qty int not null default 0 check (qty >= 0),
  primary key (user_id, code)
);
alter table user_powerups enable row level security;
drop policy if exists powerups_select on user_powerups;
create policy powerups_select on user_powerups for select using (user_id = auth.uid() or is_tutor());
grant select on user_powerups to authenticated;
grant all on user_powerups to service_role;

alter table shop_items drop constraint if exists shop_items_kind_check;
alter table shop_items add constraint shop_items_kind_check
  check (kind in ('title', 'name_style', 'frame', 'hat', 'pattern', 'streak_freeze', 'face_acc', 'back', 'powerup'));
insert into shop_items(code, kind, name, description, price, rarity, min_level, data, sort, active)
values ('extension', 'powerup', 'Homework Extension', '+48 hours on one homework deadline. Hold up to 2.', 120, 'rare', 3, '{}'::jsonb, 200, true)
on conflict (kind, code) do nothing;

create or replace function buy_item(p_item uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare it shop_items%rowtype; prof profiles%rowtype; held int;
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
  elsif it.kind = 'powerup' then
    select coalesce(qty, 0) into held from user_powerups where user_id = prof.id and code = it.code;
    if coalesce(held, 0) >= 2 then raise exception 'you can only hold 2 of these'; end if;
    insert into user_powerups(user_id, code, qty) values (prof.id, it.code, 1)
    on conflict (user_id, code) do update set qty = user_powerups.qty + 1;
    update profiles set coins = coins - it.price where id = prof.id;
  else
    if exists (select 1 from user_items where user_id = prof.id and item_id = it.id) then raise exception 'you already own this'; end if;
    insert into user_items(user_id, item_id) values (prof.id, it.id);
    update profiles set coins = coins - it.price where id = prof.id;
  end if;
  insert into xp_events(user_id, amount, coins, reason, ref) values (prof.id, 0, -it.price, 'shop', it.code);
  return jsonb_build_object('coins', prof.coins - it.price, 'kind', it.kind, 'code', it.code);
end $$;

-- use a Homework Extension: +48h on one assignment you haven't handed in (once per assignment, up to 24h after it was due)
create or replace function use_extension(p_assignment uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare a assignments%rowtype; ov assignment_overrides%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into a from assignments where id = p_assignment;
  if not found or a.due_at is null then raise exception 'this homework has no deadline'; end if;
  if exists (select 1 from submissions where assignment_id = a.id and user_id = auth.uid()) then raise exception 'already handed in'; end if;
  select * into ov from assignment_overrides where assignment_id = a.id and user_id = auth.uid();
  if found and ov.extra_hours > 0 then raise exception 'you already extended this one'; end if;
  if now() > a.due_at + interval '24 hours' then raise exception 'too late to extend this one'; end if;
  update user_powerups set qty = qty - 1 where user_id = auth.uid() and code = 'extension' and qty > 0;
  if not found then raise exception 'you have no extensions: buy one in the shop'; end if;
  insert into assignment_overrides(assignment_id, user_id, extra_hours) values (a.id, auth.uid(), 48)
  on conflict (assignment_id, user_id) do update set extra_hours = 48;
  return a.due_at + interval '48 hours';
end $$;
revoke all on function use_extension(uuid) from public, anon;
grant execute on function use_extension(uuid) to authenticated;

-- marking counts an extended deadline as on time
create or replace function grade_submission(p_submission uuid, p_score int, p_feedback text)
returns void language plpgsql security definer set search_path = public as $$
declare s submissions%rowtype; a assignments%rowtype; c courses%rowtype; first_grade boolean; extra int;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  select * into s from submissions where id = p_submission for update;
  select * into a from assignments where id = s.assignment_id;
  select * into c from courses where id = a.course_id;
  select coalesce(extra_hours, 0) into extra from assignment_overrides where assignment_id = a.id and user_id = s.user_id;
  first_grade := s.graded_at is null;
  update submissions set score = p_score, feedback = p_feedback, graded_at = now() where id = s.id;
  if first_grade then
    perform award_xp(s.user_id, round(a.xp_reward * least(1, greatest(0, p_score::numeric / a.max_score)))::int
                     + 20, 'homework', a.id::text, c.tier, 10, true);
    if a.due_at is null or s.submitted_at <= a.due_at + make_interval(hours => coalesce(extra, 0)) then
      perform bump_challenge(s.user_id, 'homework_on_time', 1, null);
    end if;
    perform check_achievements(s.user_id);
  end if;
  perform notify(s.user_id, 'Marked: ' || a.title, p_score || ' / ' || a.max_score, '/homework');
end $$;

-- ---------------------------------------------------------------- 🕶️ the black market
-- Every deal is logged here. Only the tutor can read it (but the shop UI never shows it: you'd have to look).
create table if not exists black_market_log (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  item text not null,
  target uuid,
  coins int not null,
  xp int not null,
  owner_alerted boolean not null default false,
  created_at timestamptz not null default now()
);
alter table black_market_log enable row level security;
drop policy if exists bm_select on black_market_log;
create policy bm_select on black_market_log for select using (user_id = auth.uid() or is_tutor());
grant select on black_market_log to authenticated;
grant all on black_market_log to service_role;

-- what the seller has, and whether the owner is around
create or replace function black_market_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'owner_online', exists (select 1 from profiles where role = 'tutor' and last_seen_at > now() - interval '3 minutes'),
    'uses', jsonb_build_object(
      'bunk', (select count(*) from black_market_log where user_id = auth.uid() and item = 'bunk'),
      'skip', (select count(*) from black_market_log where user_id = auth.uid() and item = 'skip')),
    'max_uses', 3,
    'prices', jsonb_build_object(
      'bunk', jsonb_build_object('coins', 2500, 'xp', 1500),
      'skip', jsonb_build_object('coins', 3500, 'xp', 2500)))
  where is_approved();
$$;
revoke all on function black_market_status() from public, anon;
grant execute on function black_market_status() to authenticated;

create or replace function black_market_buy(p_item text, p_target uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof profiles%rowtype; price_c int; price_x int; used int; tgt_title text; alerted boolean := false; t record;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into prof from profiles where id = auth.uid() for update;
  if prof.role <> 'student' then raise exception 'the seller doesn''t deal with the owner. Nice try.'; end if;
  if p_item not in ('bunk', 'skip') then raise exception 'never heard of it'; end if;
  price_c := case p_item when 'bunk' then 2500 else 3500 end;
  price_x := case p_item when 'bunk' then 1500 else 2500 end;
  select count(*) into used from black_market_log where user_id = prof.id and item = p_item;
  if used >= 3 then raise exception 'it''s broken. The seller won''t sell you another.'; end if;
  if prof.coins < price_c then raise exception 'not enough coins, kid'; end if;
  if prof.xp < price_x then raise exception 'not enough XP, kid'; end if;

  if p_item = 'skip' then
    select a.title into tgt_title from assignments a where a.id = p_target;
    if tgt_title is null then raise exception 'no such homework'; end if;
    if exists (select 1 from submissions where assignment_id = p_target and user_id = prof.id) then raise exception 'you already handed that in'; end if;
    if exists (select 1 from assignment_overrides where assignment_id = p_target and user_id = prof.id and exempt) then raise exception 'already skipped'; end if;
    insert into assignment_overrides(assignment_id, user_id, exempt) values (p_target, prof.id, true)
    on conflict (assignment_id, user_id) do update set exempt = true;
  else
    select s.title, s.held_on into t from attendance a join class_sessions s on s.id = a.session_id
    where a.session_id = p_target and a.user_id = prof.id and a.status = 'absent' and s.held_on >= current_date - 30;
    if not found then raise exception 'no absence like that in the last 30 days'; end if;
    tgt_title := t.title || ' (' || to_char(t.held_on, 'DD Mon') || ')';
    update attendance set status = 'excused' where session_id = p_target and user_id = prof.id;
  end if;

  -- pay: coins and XP (a negative XP event, so the season leaderboard drops too)
  update profiles set coins = coins - price_c, xp = xp - price_x where id = prof.id;
  insert into xp_events(user_id, amount, coins, reason, ref) values (prof.id, -price_x, -price_c, 'black_market', p_item);

  -- 50% chance the owner sees it, but only if they're online right now
  if exists (select 1 from profiles where role = 'tutor' and last_seen_at > now() - interval '3 minutes') and random() < 0.5 then
    alerted := true;
    perform notify(p.id, '🕵️ Black market deal spotted!',
      prof.display_name || ' just bought a ' || case p_item when 'bunk' then 'Bunk Card' else 'Skip Homework Pass' end || ' for "' || tgt_title || '"', '/tutor/students/' || prof.id)
    from profiles p where p.role = 'tutor';
  end if;
  insert into black_market_log(user_id, item, target, coins, xp, owner_alerted) values (prof.id, p_item, p_target, price_c, price_x, alerted);
  return jsonb_build_object('uses_left', 3 - used - 1, 'caught', alerted);
end $$;
revoke all on function black_market_buy(text, uuid) from public, anon;
grant execute on function black_market_buy(text, uuid) to authenticated;
