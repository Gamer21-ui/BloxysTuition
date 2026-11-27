-- Heist update (27 Nov 2026): Mr. Shades' vault, heists and grudges. Needs the Bounty update first. Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- The Heist: rob Mr. Shades' vault (every coin he's ever been paid, minus what's been stolen).
-- Unlocks when the student is a customer (bought something), comes to class (75%+ in the last 30 days)
-- and has earned his trust (shook on a deal after charming him). Cracking the vault = answering 3 questions fast:
-- each right answer raises the odds. Escape = 50–75% of the vault. Caught = his prices are +50% for you
-- until you talk him into forgiving you. One attempt every 7 days.

create table if not exists bm_heists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  question_ids uuid[] not null,
  status text not null default 'cracking' check (status in ('cracking', 'escaped', 'caught')),
  correct int,
  chance int,
  loot int not null default 0,
  vault_before int not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists bm_heists_user on bm_heists(user_id, started_at desc);
alter table bm_heists enable row level security;
drop policy if exists bm_heists_select on bm_heists;
create policy bm_heists_select on bm_heists for select using (user_id = auth.uid() or is_tutor());
revoke all on bm_heists from authenticated, anon;
grant select on bm_heists to authenticated;
grant all on bm_heists to service_role;

-- a caught thief: +50% prices until forgiven. The apology chat is scored by the server (service role) only.
create table if not exists bm_grudges (
  user_id uuid primary key references profiles(id) on delete cascade,
  caught_at timestamptz not null default now(),
  forgiven_at timestamptz,
  day date,                                      -- the apology conversation restarts every day
  messages jsonb not null default '[]'::jsonb,
  turns int not null default 0,
  score int not null default 0
);
alter table bm_grudges enable row level security;
drop policy if exists bm_grudges_select on bm_grudges;
create policy bm_grudges_select on bm_grudges for select using (user_id = auth.uid() or is_tutor());
revoke all on bm_grudges from authenticated, anon;
grant select on bm_grudges to authenticated;
grant all on bm_grudges to service_role;

create or replace function bm_vault() returns int
language sql stable security definer set search_path = public as $$
  select greatest(0, coalesce((select sum(coins) from black_market_log), 0) - coalesce((select sum(loot) from bm_heists where status = 'escaped'), 0))::int;
$$;

create or replace function bm_grudge(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bm_grudges where user_id = p_user and forgiven_at is null);
$$;

-- everything the heist screen needs
create or replace function heist_status() returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare me uuid := auth.uid(); bought int; held int; came int; trusted boolean; last bm_heists%rowtype; next_at timestamptz; vault int;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select count(*) into bought from black_market_log where user_id = me;
  select count(*), count(*) filter (where a.status in ('present', 'late')) into held, came
    from attendance a join class_sessions s on s.id = a.session_id where a.user_id = me and s.held_on > current_date - 30;
  -- trust = once charmed him properly (score 65+, the 25% tier, even for top players capped lower) and shook on it
  trusted := exists (select 1 from black_market_haggles where user_id = me and score >= 65 and status in ('deal', 'used'));
  select * into last from bm_heists where user_id = me order by started_at desc limit 1;
  next_at := case when last.id is null then null else last.started_at + interval '7 days' end;
  vault := bm_vault();
  return jsonb_build_object(
    'vault', vault,
    'customer', bought >= 1, 'bought', bought,
    'regular', held >= 3 and came * 100 >= held * 75, 'held', held, 'came', came,
    'trusted', trusted,
    'grudge', bm_grudge(me),
    'next_at', case when next_at > now() then next_at end,
    'last', case when last.id is null then null else jsonb_build_object('status', last.status, 'loot', last.loot, 'at', last.started_at) end,
    'owner_online', exists (select 1 from profiles where role = 'tutor' and last_seen_at > now() - interval '3 minutes'));
end $$;
revoke all on function heist_status() from public, anon;
grant execute on function heist_status() to authenticated;

-- step 1: pick the lock. Returns 3 questions from the student's own subjects (no answers).
create or replace function heist_start() returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof profiles%rowtype; st jsonb; ids uuid[]; h uuid;
begin
  select * into prof from profiles where id = auth.uid() for update;
  if prof.role <> 'student' then raise exception 'the owner doesn''t rob the shop. It''s your shop.'; end if;
  st := heist_status();
  if not (st->>'customer')::boolean then raise exception 'he doesn''t even know you. Buy something first'; end if;
  if not (st->>'regular')::boolean then raise exception 'you''re never in class. He''d notice you sneaking around'; end if;
  if not (st->>'trusted')::boolean then raise exception 'he doesn''t trust you enough to turn his back. Shake on a good deal first'; end if;
  if (st->>'grudge')::boolean then raise exception 'he''s watching you like a hawk since last time'; end if;
  if st->>'next_at' is not null then raise exception 'lie low for a while. Next chance: %', to_char((st->>'next_at')::timestamptz at time zone 'Indian/Mauritius', 'DD Mon HH24:MI'); end if;
  if (st->>'vault')::int < 500 then raise exception 'the vault''s almost empty. Not worth the risk'; end if;
  select array_agg(id) into ids from (
    select q.id from questions q join question_keys k on k.question_id = q.id join courses c on c.id = q.course_id
    join chapters ch on ch.id = q.chapter_id
    where q.battle_ok and q.source = 'quiz' and is_live(ch.status, ch.release_at)
      and ((c.tier = 'O') = (prof.tier = 'O'))
      and (prof.subjects is null or cardinality(prof.subjects) = 0 or subject_of(c.slug) = any(prof.subjects))
    order by random() limit 3) s;
  if ids is null or cardinality(ids) < 3 then raise exception 'no questions for your subjects yet'; end if;
  insert into bm_heists(user_id, question_ids, vault_before) values (prof.id, ids, (st->>'vault')::int) returning id into h;
  return jsonb_build_object('id', h, 'seconds', 45,
    'questions', (select jsonb_agg(jsonb_build_object('prompt', q.prompt, 'options', q.options) order by array_position(ids, q.id)) from questions q where q.id = any(ids)));
end $$;
revoke all on function heist_start() from public, anon;
grant execute on function heist_start() to authenticated;

-- step 2: hand in the combination. Odds: 25% + 20% per right answer (max 85%), minus 20% if the owner is online.
create or replace function heist_finish(p_heist uuid, p_answers int[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare h bm_heists%rowtype; right_n int := 0; i int; k int; v_chance int; ok boolean; vault int; pct int; v_loot int := 0; nm text;
begin
  select * into h from bm_heists where id = p_heist for update;
  if not found or h.user_id <> auth.uid() then raise exception 'that''s not your heist'; end if;
  if h.status <> 'cracking' then raise exception 'this heist is already over'; end if;
  -- too slow (45s + a little grace) = every answer counts as wrong
  if now() <= h.started_at + interval '55 seconds' then
    for i in 1..3 loop
      select correct into k from question_keys where question_id = h.question_ids[i];
      if p_answers is not null and cardinality(p_answers) >= i and p_answers[i] = k then right_n := right_n + 1; end if;
    end loop;
  end if;
  v_chance := 25 + 20 * right_n;
  if exists (select 1 from profiles where role = 'tutor' and last_seen_at > now() - interval '3 minutes') then v_chance := v_chance - 20; end if;
  ok := random() * 100 < v_chance;
  select display_name into nm from profiles where id = h.user_id;
  if ok then
    vault := bm_vault();
    pct := 50 + floor(random() * 26)::int;              -- 50–75%
    v_loot := floor(vault * pct / 100.0)::int;
    update bm_heists set status = 'escaped', correct = right_n, chance = v_chance, loot = v_loot, finished_at = now() where id = h.id;
    perform award_xp(h.user_id, 0, 'heist', h.id::text, null, v_loot, false);
    perform notify(p.id, '[$] Mr. Shades got robbed!', nm || ' cracked the Black Market vault and escaped with ' || v_loot || ' coins.', '/tutor/students/' || h.user_id)
      from profiles p where p.role = 'tutor';
  else
    update bm_heists set status = 'caught', correct = right_n, chance = v_chance, finished_at = now() where id = h.id;
    insert into bm_grudges(user_id, caught_at) values (h.user_id, now())
    on conflict (user_id) do update set caught_at = now(), forgiven_at = null, day = null, messages = '[]'::jsonb, turns = 0, score = 0;
    perform notify(p.id, '[!] Heist foiled', 'Mr. Shades caught ' || nm || ' with a hand in his vault. Their prices are +50% until he forgives them.', '/tutor/students/' || h.user_id)
      from profiles p where p.role = 'tutor';
  end if;
  return jsonb_build_object('success', ok, 'correct', right_n, 'chance', greatest(v_chance, 5), 'loot', v_loot, 'pct', pct,
    'answers', (select jsonb_agg(k2.correct order by array_position(h.question_ids, k2.question_id)) from question_keys k2 where k2.question_id = any(h.question_ids)));
end $$;
revoke all on function heist_finish(uuid, int[]) from public, anon;
grant execute on function heist_finish(uuid, int[]) to authenticated;

-- the visit now also says whether he holds a grudge
create or replace function black_market_visit() returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not is_approved() then raise exception 'not approved'; end if;
  insert into black_market_visits(user_id, day, visits) values (auth.uid(), today_local(), 1)
  on conflict (user_id, day) do update set visits = black_market_visits.visits + 1;
  return jsonb_build_object('week', bm_week_visits(auth.uid()), 'overdue', overdue_homework(auth.uid()), 'tax', bm_tax(auth.uid()),
                            'grudge', bm_grudge(auth.uid()));
end $$;
revoke all on function bm_vault() from public, anon;
revoke all on function bm_grudge(uuid) from public, anon;
grant execute on function bm_grudge(uuid) to service_role;

-- buying while he holds a grudge: +50% on top of everything
create or replace function black_market_buy(p_item text, p_target uuid, p_haggle uuid default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare prof profiles%rowtype; price_c int; price_x int; used int; tgt_title text; alerted boolean := false; t record;
        h black_market_haggles%rowtype; off int := 0; tax int := 0; grudge boolean;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into prof from profiles where id = auth.uid() for update;
  if prof.role <> 'student' then raise exception 'the seller doesn''t deal with the owner. Nice try.'; end if;
  if p_item not in ('bunk', 'skip') then raise exception 'never heard of it'; end if;
  select coins, xp into price_c, price_x from bm_price(p_item);
  if p_haggle is not null then
    select * into h from black_market_haggles where id = p_haggle for update;
    if not found or h.user_id <> prof.id or h.item <> p_item then raise exception 'that deal isn''t yours, kid'; end if;
    if h.status <> 'deal' or h.expires_at < now() then raise exception 'that deal expired. Talk to me again'; end if;
    off := h.discount;
    price_c := round(price_c * (100 - off) / 100.0);
    price_x := round(price_x * (100 - off) / 100.0);
  end if;
  tax := bm_tax(prof.id);
  if tax > 0 then
    price_c := round(price_c * (100 + tax) / 100.0);
    price_x := round(price_x * (100 + tax) / 100.0);
  end if;
  grudge := bm_grudge(prof.id);
  if grudge then
    price_c := round(price_c * 1.5);
    price_x := round(price_x * 1.5);
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
  return jsonb_build_object('uses_left', 3 - used - 1, 'caught', alerted, 'paid_coins', price_c, 'paid_xp', price_x, 'discount', off, 'tax', tax, 'grudge', grudge);
end $$;
revoke all on function black_market_buy(text, uuid, uuid) from public, anon;
grant execute on function black_market_buy(text, uuid, uuid) to authenticated;
