-- 🤝 Black Market haggling + new prices.
-- Students chat with the seller; the SERVER (service role) scores the chat and writes the deal here.
-- Students can read their own haggles but never write them, so the discount can't be faked.
-- Discount tiers: 0 / 15 / 25 / 50 %. A deal lasts 15 minutes and is used once.

create table if not exists black_market_haggles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item text not null check (item in ('bunk', 'skip')),
  messages jsonb not null default '[]'::jsonb,     -- [{from: 'me'|'seller', text}]
  turns int not null default 0,
  score int not null default 0 check (score between 0 and 100),
  discount int not null default 0 check (discount in (0, 15, 25, 50)),
  status text not null default 'open' check (status in ('open', 'deal', 'used', 'walked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes'
);
create index if not exists bm_haggles_user on black_market_haggles(user_id, created_at desc);
alter table black_market_haggles enable row level security;
drop policy if exists bm_haggles_select on black_market_haggles;
create policy bm_haggles_select on black_market_haggles for select using (user_id = auth.uid() or is_tutor());
revoke all on black_market_haggles from authenticated, anon;
grant select on black_market_haggles to authenticated;
grant all on black_market_haggles to service_role;

-- one place for the prices
create or replace function bm_price(p_item text, out coins int, out xp int)
language sql immutable as $$
  select case p_item when 'bunk' then 750 else 3500 end, case p_item when 'bunk' then 1500 else 2500 end;
$$;

create or replace function black_market_status() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'owner_online', exists (select 1 from profiles where role = 'tutor' and last_seen_at > now() - interval '3 minutes'),
    'uses', jsonb_build_object(
      'bunk', (select count(*) from black_market_log where user_id = auth.uid() and item = 'bunk'),
      'skip', (select count(*) from black_market_log where user_id = auth.uid() and item = 'skip')),
    'max_uses', 3,
    'prices', jsonb_build_object(
      'bunk', jsonb_build_object('coins', (bm_price('bunk')).coins, 'xp', (bm_price('bunk')).xp),
      'skip', jsonb_build_object('coins', (bm_price('skip')).coins, 'xp', (bm_price('skip')).xp)))
  where is_approved();
$$;
revoke all on function black_market_status() from public, anon;
grant execute on function black_market_status() to authenticated;

drop function if exists black_market_buy(text, uuid);
create or replace function black_market_buy(p_item text, p_target uuid, p_haggle uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof profiles%rowtype; price_c int; price_x int; used int; tgt_title text; alerted boolean := false; t record;
        h black_market_haggles%rowtype; off int := 0;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into prof from profiles where id = auth.uid() for update;
  if prof.role <> 'student' then raise exception 'the seller doesn''t deal with the owner. Nice try.'; end if;
  if p_item not in ('bunk', 'skip') then raise exception 'never heard of it'; end if;
  select coins, xp into price_c, price_x from bm_price(p_item);
  -- a deal the student talked their way into (written by the server, used once, 15 min)
  if p_haggle is not null then
    select * into h from black_market_haggles where id = p_haggle for update;
    if not found or h.user_id <> prof.id or h.item <> p_item then raise exception 'that deal isn''t yours, kid'; end if;
    if h.status <> 'deal' or h.expires_at < now() then raise exception 'that deal expired. Talk to me again'; end if;
    off := h.discount;
    price_c := round(price_c * (100 - off) / 100.0);
    price_x := round(price_x * (100 - off) / 100.0);
  end if;
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

  if p_haggle is not null then update black_market_haggles set status = 'used' where id = p_haggle; end if;
  update profiles set coins = coins - price_c, xp = xp - price_x where id = prof.id;
  insert into xp_events(user_id, amount, coins, reason, ref) values (prof.id, -price_x, -price_c, 'black_market', p_item);

  if exists (select 1 from profiles where role = 'tutor' and last_seen_at > now() - interval '3 minutes') and random() < 0.5 then
    alerted := true;
    perform notify(p.id, '🕵️ Black market deal spotted!',
      prof.display_name || ' just bought a ' || case p_item when 'bunk' then 'Bunk Card' else 'Skip Homework Pass' end
      || case when off > 0 then ' (haggled ' || off || '% off!)' else '' end || ' for "' || tgt_title || '"', '/tutor/students/' || prof.id)
    from profiles p where p.role = 'tutor';
  end if;
  insert into black_market_log(user_id, item, target, coins, xp, owner_alerted) values (prof.id, p_item, p_target, price_c, price_x, alerted);
  return jsonb_build_object('uses_left', 3 - used - 1, 'caught', alerted, 'paid_coins', price_c, 'paid_xp', price_x, 'discount', off);
end $$;
revoke all on function black_market_buy(text, uuid, uuid) from public, anon;
grant execute on function black_market_buy(text, uuid, uuid) to authenticated;
