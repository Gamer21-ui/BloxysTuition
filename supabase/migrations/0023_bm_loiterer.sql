-- 🧾 Mr. Shades notices loiterers.
-- Every Black Market visit is counted. Lots of visits in a week WITH overdue homework = a 10% "loiterer tax"
-- on his prices (and a roasting). Doing your homework removes it.

create table if not exists black_market_visits (
  user_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  visits int not null default 0,
  primary key (user_id, day)
);
alter table black_market_visits enable row level security;
drop policy if exists bm_visits_select on black_market_visits;
create policy bm_visits_select on black_market_visits for select using (user_id = auth.uid() or is_tutor());
grant select on black_market_visits to authenticated;
grant all on black_market_visits to service_role;

-- homework that's past its due date, not handed in and not skipped, for the courses this student takes
create or replace function overdue_homework(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from assignments a join courses c on c.id = a.course_id join profiles p on p.id = p_user
  where a.status = 'published' and a.due_at is not null and a.due_at < now()
    and (p.subjects is null or cardinality(p.subjects) = 0 or subject_of(c.slug) = any(p.subjects))
    and ((c.tier = 'O') = (p.tier = 'O'))
    and not exists (select 1 from submissions s where s.assignment_id = a.id and s.user_id = p_user)
    and not exists (select 1 from assignment_overrides o where o.assignment_id = a.id and o.user_id = p_user and o.exempt);
$$;

create or replace function bm_week_visits(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(sum(visits), 0)::int from black_market_visits where user_id = p_user and day > today_local() - 7;
$$;

-- +10% when: 8+ visits in the last 7 days AND at least one overdue homework
create or replace function bm_tax(p_user uuid) returns int
language sql stable security definer set search_path = public as $$
  select case when bm_week_visits(p_user) >= 8 and overdue_homework(p_user) > 0 then 10 else 0 end;
$$;

-- called when a student opens the Black Market
create or replace function black_market_visit() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not is_approved() then raise exception 'not approved'; end if;
  insert into black_market_visits(user_id, day, visits) values (auth.uid(), today_local(), 1)
  on conflict (user_id, day) do update set visits = black_market_visits.visits + 1;
  return jsonb_build_object('week', bm_week_visits(auth.uid()), 'overdue', overdue_homework(auth.uid()), 'tax', bm_tax(auth.uid()));
end $$;
revoke all on function overdue_homework(uuid) from public, anon;
revoke all on function bm_week_visits(uuid) from public, anon;
revoke all on function bm_tax(uuid) from public, anon;
revoke all on function black_market_visit() from public, anon;
grant execute on function black_market_visit() to authenticated;
grant execute on function overdue_homework(uuid), bm_week_visits(uuid), bm_tax(uuid) to service_role;

create or replace function black_market_buy(p_item text, p_target uuid, p_haggle uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof profiles%rowtype; price_c int; price_x int; used int; tgt_title text; alerted boolean := false; t record;
        h black_market_haggles%rowtype; off int := 0; tax int := 0;
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
  -- loiterer tax: hanging around the alley a lot with overdue homework = +10%
  tax := bm_tax(prof.id);
  if tax > 0 then
    price_c := round(price_c * (100 + tax) / 100.0);
    price_x := round(price_x * (100 + tax) / 100.0);
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
  -- a bunk still counts as "attended" for quests and achievements (that's what they paid for)
  if p_item = 'bunk' then
    perform bump_challenge(prof.id, 'attendance', 1, null);
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
  if p_item = 'bunk' then perform check_achievements(prof.id); end if;
  return jsonb_build_object('uses_left', 3 - used - 1, 'caught', alerted, 'paid_coins', price_c, 'paid_xp', price_x, 'discount', off, 'tax', tax);
end $$;
revoke all on function black_market_buy(text, uuid, uuid) from public, anon;
grant execute on function black_market_buy(text, uuid, uuid) to authenticated;
