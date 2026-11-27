-- 🃏 Bunk Card upgrade: a bought bunk now protects the student.
-- * Excused sessions no longer count against attendance % (done in the app).
-- * A bunked class still counts as "attended" for attendance quests and achievements
--   (but NOT for the attendance leaderboard: that stays real attendance only).

create or replace function check_achievements(p_user uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  a achievements%rowtype;
  prof profiles%rowtype;
  v int;
  have int;
begin
  select * into prof from profiles where id = p_user;
  for a in
    select * from achievements x where active
      and not exists (select 1 from user_achievements u where u.user_id = p_user and u.achievement_id = x.id)
  loop
    v := (a.criteria->>'value')::int;
    have := case a.criteria->>'type'
      when 'streak' then prof.best_streak
      when 'level' then level_from_xp(prof.xp)
      when 'quizzes_passed' then (select count(distinct quiz_id) from quiz_attempts
          where user_id = p_user and not flagged and total > 0 and score * 2 >= total)
      when 'perfect_quiz' then (select count(*) from quiz_attempts
          where user_id = p_user and not flagged and total > 0 and score = total)
      when 'homework' then (select count(*) from submissions where user_id = p_user)
      when 'battles_won' then (select count(*) from battles b join battle_players p on p.battle_id = b.id
          where p.user_id = p_user and b.status = 'finished' and b.winner_team = p.team)
      when 'battles_played' then (select count(*) from battles b join battle_players p on p.battle_id = b.id
          where p.user_id = p_user and b.status = 'finished')
      when 'attendance' then (select count(*) from attendance where user_id = p_user and status in ('present','late'))
          -- + classes covered by a Bunk Card (still excused)
          + (select count(*) from black_market_log l join attendance x on x.session_id = l.target and x.user_id = l.user_id
             where l.user_id = p_user and l.item = 'bunk' and x.status = 'excused')
      when 'speedrun_points' then (select coalesce(max(points), 0) from quiz_attempts q join quizzes z on z.id = q.quiz_id
          where q.user_id = p_user and z.kind = 'speedrun' and not q.flagged)
      else 0 end;
    if coalesce(have, 0) >= v then
      insert into user_achievements(user_id, achievement_id) values (p_user, a.id) on conflict do nothing;
      perform award_xp(p_user, a.xp_reward, 'achievement', a.code, null, 0, false);
      perform notify(p_user, 'Achievement unlocked: ' || a.title, a.description, '/achievements');
    end if;
  end loop;
end $$;

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
  return jsonb_build_object('uses_left', 3 - used - 1, 'caught', alerted, 'paid_coins', price_c, 'paid_xp', price_x, 'discount', off);
end $$;
revoke all on function black_market_buy(text, uuid, uuid) from public, anon;
grant execute on function black_market_buy(text, uuid, uuid) to authenticated;
