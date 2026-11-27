-- Friends, parties, chat, battle levels and exam rules. Runs last.
\set ON_ERROR_STOP 1
reset role;
create or replace function pg_temp.as_user(u text) returns void language sql as $$ select set_config('request.jwt.claim.sub', u, false); $$;
\set ava '00000000-0000-0000-0000-000000000002'
\set ben '00000000-0000-0000-0000-000000000003'
\set cara '00000000-0000-0000-0000-000000000004'
set role authenticated;
select pg_temp.as_user(:'ava'); select send_friend_request(:'ben') as ava_to_ben;
select pg_temp.as_user(:'ben'); select count(*) as ben_pending_should_be_1 from friendships where addressee = auth.uid() and status = 'pending';
select respond_friend_request(:'ava', true);
select are_friends(:'ava', :'ben') as friends_should_be_true;
select pg_temp.as_user(:'cara'); select count(*) as cara_sees_their_friendship_should_be_0 from friendships;
select count(*) > 0 as directory_lists_students from student_directory();
select pg_temp.as_user(:'ava');
do $$ begin perform party_invite('00000000-0000-0000-0000-000000000004'); raise exception 'invited a non-friend!';
exception when others then if sqlerrm like '%only invite friends%' then raise notice 'ok: friends only'; else raise; end if; end $$;
select party_invite(:'ben');
select pg_temp.as_user(:'ben'); select party_accept((select party_id from party_invites where to_id = auth.uid()));
select count(*) as party_size_should_be_2 from party_members where party_id = my_party();
-- leader makes a 2v2: Ben is pulled onto team 1 automatically
select pg_temp.as_user(:'ava'); select create_battle('2v2', null, 5, 'O') as code \gset
select user_id = :'ben' as ben_in, team from battle_players bp join battles b on b.id = bp.battle_id where b.code = :'code' and user_id = :'ben';
select tier as battle_tier_should_be_O, (select battle_code from parties where leader_id = auth.uid()) = :'code' as party_knows_code from battles where code = :'code';
-- chat
select post_chat('anyone up for a battle?') > 0 as posted;
select post_chat('2v2 accounts, come!', :'code') > 0 as posted_battle;
select kind, mode, tier from chat_messages where kind = 'battle';
select pg_temp.as_user(:'cara'); select count(*) as cara_sees_2_messages from chat_messages;
select delete_chat((select id from chat_messages where kind = 'text' limit 1));
select count(*) as still_2_cara_cannot_delete_others from chat_messages;
select pg_temp.as_user(:'ava'); select delete_chat((select id from chat_messages where kind = 'text' limit 1));
select count(*) as now_1_after_own_delete from chat_messages;
do $$ declare i int; begin for i in 1..10 loop perform post_chat('spam ' || i); end loop; raise exception 'no rate limit!';
exception when others then if sqlerrm like '%slow down%' then raise notice 'ok: chat rate limited'; else raise; end if; end $$;
-- a mixed AS-level battle only draws AS questions
select create_battle('1v1', null, 3, 'AS') as ascode \gset
reset role; insert into battle_players(battle_id, user_id, team) select id, '00000000-0000-0000-0000-000000000004', 2 from battles where code = :'ascode'; set role authenticated;
select pg_temp.as_user(:'ava');
select start_battle((select id from battles where tier = 'AS' limit 1));
reset role;
do $$ begin
  if exists (select 1 from battle_rounds r join battles b on b.id = r.battle_id join questions q on q.id = r.question_id
             join courses c on c.id = q.course_id where b.tier = 'AS' and c.tier <> 'AS') then raise exception 'AS battle used non-AS questions'; end if;
  if (select count(*) from battle_rounds r join battles b on b.id = r.battle_id where b.tier = 'AS') <> 3 then raise exception 'AS battle has wrong round count'; end if;
  raise notice 'ok: level-filtered questions';
end $$;
set role authenticated; select pg_temp.as_user(:'ava');
-- party leave by leader disbands
select party_leave(); select count(*) as parties_left_should_be_0 from parties;
-- exams: one attempt, closing time, focus count
reset role;
update quizzes set status = 'published', max_attempts = 1, closes_at = now() + interval '1 day' where kind = 'exam' and course_id = (select id from courses where slug = 'o-economics');
set role authenticated; select pg_temp.as_user(:'cara');
select (start_quiz((select id from quizzes where kind = 'exam' and course_id = (select id from courses where slug = 'o-economics')))->>'attempt_id') as ex \gset
reset role; update quiz_attempts set started_at = now() - interval '10 minutes' where id = :'ex'; set role authenticated; select pg_temp.as_user(:'cara');
select (submit_quiz(:'ex', '{}'::jsonb, 3))->>'score' as score;
select focus_lost as focus_lost_should_be_3 from quiz_attempts where id = :'ex';
do $$ begin perform start_quiz((select id from quizzes where kind = 'exam' and course_id = (select id from courses where slug = 'o-economics'))); raise exception 'second attempt allowed!';
exception when others then if sqlerrm like '%no attempts left%' then raise notice 'ok: one attempt only'; else raise; end if; end $$;
reset role; update quizzes set closes_at = now() - interval '1 minute', max_attempts = null where kind = 'exam' and course_id = (select id from courses where slug = 'o-economics');
set role authenticated; select pg_temp.as_user(:'cara');
do $$ begin perform start_quiz((select id from quizzes where kind = 'exam' and course_id = (select id from courses where slug = 'o-economics'))); raise exception 'closed exam started!';
exception when others then if sqlerrm like '%exam closed%' then raise notice 'ok: closed exam'; else raise; end if; end $$;
-- new shop slots
select equip_item('back', null) is null as back_slot_ok;
reset role;
-- new pixel item slots
update profiles set coins = coins + 1000 where display_name = 'Ben';
set role authenticated; select pg_temp.as_user('00000000-0000-0000-0000-000000000003');
select buy_item((select id from shop_items where kind = 'face_acc' and code = 'shades')) is not null as bought_shades;
select equip_item('face_acc', 'shades');
select blocky->>'face_acc' as face_should_be_shades from profiles where id = auth.uid();
do $$ begin perform equip_item('back', 'jetpack'); raise exception 'equipped unowned jetpack!';
exception when others then if sqlerrm like '%do not own%' then raise notice 'ok: back slot ownership checked'; else raise; end if; end $$;
reset role;
-- subjects: students pick from their own level only
reset role;
set role authenticated; select pg_temp.as_user(:'ava');
do $$ declare r text[]; begin
  r := set_my_subjects(array['economics', 'accounting', 'made-up']);
  if (select tier from profiles where id = auth.uid()) = 'O' and r <> array['accounting', 'economics'] then raise exception 'bad O subjects: %', r; end if;
  begin perform set_my_subjects(array['made-up']); raise exception 'accepted an empty pick';
  exception when others then if sqlerrm not like '%at least one%' then raise; end if; end;
  raise notice 'ok: subjects saved as %', r;
end $$;
reset role;
-- AS + A Level battles: one subject across both levels
set role authenticated; select pg_temp.as_user(:'ava');
select create_battle('1v1', null, 6, 'A', 'economics', true) as asacode \gset
reset role; insert into battle_players(battle_id, user_id, team) select id, '00000000-0000-0000-0000-000000000004', 2 from battles where code = :'asacode';
set role authenticated; select pg_temp.as_user(:'ava');
select start_battle((select id from battles where code = :'asacode'));
reset role;
do $$ declare bad int; lv int; begin
  select count(*) filter (where c.slug not in ('as-economics', 'a-economics')), count(distinct c.tier) into bad, lv
  from battle_rounds r join battles b on b.id = r.battle_id join questions q on q.id = r.question_id join courses c on c.id = q.course_id
  where b.subject = 'economics' and b.both_levels;
  if bad > 0 then raise exception 'AS+A economics battle used other questions'; end if;
  raise notice 'ok: AS + A Level economics battle (levels used: %)', lv;
end $$;
set role authenticated; select pg_temp.as_user(:'ava');
do $$ begin perform create_battle('1v1', null, 5, 'O', 'computer-sciencez', false); raise exception 'accepted a fake subject';
exception when others then if sqlerrm not like '%no such subject%' then raise; end if; end $$;
reset role;
-- site tour: students finish it, only the tutor can relaunch it
set role authenticated; select pg_temp.as_user(:'ava');
do $$ begin perform relaunch_tutorial(); raise exception 'student relaunched the tour';
exception when others then if sqlerrm not like '%tutor only%' then raise; end if; end $$;
select finish_tutorial();
reset role;
select id as tutor_id from profiles where role = 'tutor' limit 1 \gset
set role authenticated; select pg_temp.as_user(:'tutor_id');
select relaunch_tutorial() as tv \gset
reset role;
do $$ begin
  if (select tutorial_version from site_settings) < 2 then raise exception 'version not bumped'; end if;
  if exists (select 1 from profiles p, site_settings s where p.role = 'student' and p.status = 'approved' and p.tutorial_version >= s.tutorial_version) then raise exception 'students should see it again'; end if;
  raise notice 'ok: tour relaunched';
end $$;
-- live polls: tutor launches, students vote (and can change), tally stays right, closed polls reject votes
set role authenticated; select pg_temp.as_user(:'ava');
do $$ begin perform create_poll('hack?', array['a','b']); raise exception 'student created a poll';
exception when others then if sqlerrm not like '%tutor only%' then raise; end if; end $$;
reset role; set role authenticated; select pg_temp.as_user(:'tutor_id');
select create_poll('Confident with depreciation?', array['Yes', 'Kind of', '', 'No'], 0) as poll \gset
set role authenticated; select pg_temp.as_user(:'ava'); select vote_poll(:'poll', 2); select vote_poll(:'poll', 1);
select pg_temp.as_user(:'ben'); select vote_poll(:'poll', 1);
reset role;
do $$ begin
  if (select counts from polls order by created_at desc limit 1) <> array[0, 2, 0] then raise exception 'bad tally: %', (select counts from polls order by created_at desc limit 1); end if;
  raise notice 'ok: poll tally %', (select counts from polls order by created_at desc limit 1);
end $$;
set role authenticated; select pg_temp.as_user(:'tutor_id'); select close_poll(:'poll');
select pg_temp.as_user(:'ava');
do $$ begin perform vote_poll((select id from polls order by created_at desc limit 1), 0); raise exception 'voted on a closed poll';
exception when others then if sqlerrm not like '%closed%' then raise; end if; end $$;
reset role;
-- chapter-only battle: O Level CS · Software
set role authenticated; select pg_temp.as_user(:'ava');
select create_battle('1v1', null, 10, null, null, false, (select ch.id from chapters ch join courses c on c.id = ch.course_id where c.slug = 'o-computer-science' and ch.title ilike '%software%' limit 1)) as chcode \gset
reset role; insert into battle_players(battle_id, user_id, team) select id, '00000000-0000-0000-0000-000000000004', 2 from battles where code = :'chcode';
set role authenticated; select pg_temp.as_user(:'ava'); select start_battle((select id from battles where code = :'chcode'));
reset role;
do $$ declare n int; bad int; begin
  select count(*), count(*) filter (where q.chapter_id <> b.chapter_id) into n, bad
  from battle_rounds r join battles b on b.id = r.battle_id join questions q on q.id = r.question_id where b.chapter_id is not null;
  if bad > 0 or n <> 10 then raise exception 'chapter battle wrong: % rounds, % off-chapter', n, bad; end if;
  raise notice 'ok: chapter battle with % rounds', n;
end $$;
-- ranked: winner gains, loser drops, same amount; pressure: an answer cuts the clock
set role authenticated; select pg_temp.as_user(:'ava');
select create_battle('1v1', null, 5, 'O', null, false, null, 'ranked') as rcode \gset
reset role; insert into battle_players(battle_id, user_id, team) select id, '00000000-0000-0000-0000-000000000004', 2 from battles where code = :'rcode';
select rating as ava_before from profiles where id = :'ava' \gset
update battle_players set score = 500 where user_id = :'ava' and battle_id = (select id from battles where code = :'rcode');
update battles set status = 'live' where code = :'rcode';
select battle_finish((select id from battles where code = :'rcode'));
select bp.team, bp.rating_delta, p.rating, p.ranked_played from battle_players bp join profiles p on p.id = bp.user_id
  where bp.battle_id = (select id from battles where code = :'rcode') order by bp.team;
do $$ begin
  if (select count(*) from battle_players where rating_delta is not null and rating_delta > 0) < 1 then raise exception 'ranked winner got no rating'; end if;
  raise notice 'ok: ranked rating applied';
end $$;
-- pressure
set role authenticated; select pg_temp.as_user(:'ava');
select create_battle('1v1', null, 3, 'O', null, false, null, 'pressure') as pcode \gset
reset role; insert into battle_players(battle_id, user_id, team) select id, '00000000-0000-0000-0000-000000000004', 2 from battles where code = :'pcode';
set role authenticated; select pg_temp.as_user(:'ava'); select start_battle((select id from battles where code = :'pcode'));
select answer_battle((select id from battles where code = :'pcode'), 0);
reset role;
do $$ declare s numeric; begin
  select extract(epoch from (phase_ends_at - phase_started_at)) into s from battles where style = 'pressure' and status = 'live' limit 1;
  if s is null or s > 11 then raise exception 'pressure did not cut the clock (% s)', s; end if;
  raise notice 'ok: pressure cut the round to % s', round(s, 1);
end $$;
-- seasons: start resets ranked, end rewards top players and creates the next season
reset role;
update seasons set starts_at = now() - interval '2 days', ends_at = now() + interval '1 day' where number = 1;
select season_tick();
do $$ begin
  if (select status from seasons where number = 1) <> 'active' then raise exception 'season 1 not active'; end if;
  if exists (select 1 from profiles where rating <> 1000 or ranked_played <> 0) then raise exception 'ranked not reset'; end if;
  raise notice 'ok: season 1 started, ranked reset';
end $$;
insert into xp_events(user_id, amount, reason, created_at) values (:'ava', 300, 'quiz', now() - interval '1 hour'), (:'ben', 120, 'quiz', now() - interval '1 hour');
update profiles set rating = 1080, ranked_played = 4 where id = :'ava';
set role authenticated; select pg_temp.as_user(:'ava');
select display_name, value from get_leaderboard('season', 5);
reset role;
update seasons set ends_at = now() - interval '1 minute' where number = 1;
select season_tick();
select season_tick();
do $$ declare n int; begin
  if (select status from seasons where number = 1) <> 'ended' then raise exception 'season 1 not ended'; end if;
  if not exists (select 1 from seasons where number = 2) then raise exception 'no season 2'; end if;
  select count(*) into n from season_results r join seasons s on s.id = r.season_id where s.number = 1;
  if n < 3 then raise exception 'expected results, got %', n; end if;
  if not exists (select 1 from user_items ui join shop_items si on si.id = ui.item_id join profiles p on p.id = ui.user_id
                 where p.id = (select user_id from season_results where board = 'xp' and place = 1) and si.code = 's1-xp-champ') then
    raise exception 'champion title missing'; end if;
  raise notice 'ok: season 1 ended with % results; season 2 = % to %', n,
    (select starts_at from seasons where number = 2), (select ends_at from seasons where number = 2);
end $$;
-- reward items can't be bought
set role authenticated; select pg_temp.as_user(:'ben');
do $$ begin perform buy_item((select id from shop_items where code = 's1-xp-champ')); raise exception 'bought a reward item';
exception when others then if sqlerrm not like '%not available%' then raise; end if; end $$;
reset role;
-- prestige: Level 20 resets to 1, keeps lifetime XP, gives coins + title + frame; can't prestige again at Level 1
reset role;
update profiles set xp = 19500 where id = :'ava';
select coins as ava_coins from profiles where id = :'ava' \gset
set role authenticated; select pg_temp.as_user(:'ava');
select do_prestige();
do $$ begin perform do_prestige(); raise exception 'prestiged twice';
exception when others then if sqlerrm not like '%Level 20%' then raise; end if; end $$;
select value from get_leaderboard('xp', 50) where id = current_setting('request.jwt.claim.sub')::uuid;
reset role;
do $$ declare p profiles%rowtype; begin
  select * into p from profiles where display_name = 'Ava';
  if p.prestige <> 1 or p.xp <> 0 or p.lifetime_xp < 19500 then raise exception 'bad prestige state: P% xp % life %', p.prestige, p.xp, p.lifetime_xp; end if;
  if not exists (select 1 from user_items ui join shop_items si on si.id = ui.item_id where ui.user_id = p.id and si.code = 'prestige-1') then raise exception 'no prestige title'; end if;
  if not exists (select 1 from user_items ui join shop_items si on si.id = ui.item_id where ui.user_id = p.id and si.kind = 'frame' and si.code = 'prestige') then raise exception 'no prestige frame'; end if;
  if unlock_level(p.xp, p.prestige) < 20 then raise exception 'unlocks lost'; end if;
  raise notice 'ok: prestige 1, lifetime % XP, unlock level %', p.lifetime_xp, unlock_level(p.xp, p.prestige);
end $$;
select (select coins from profiles where id = :'ava') - :ava_coins as coins_gained;
-- prestige boost: P1 earns 1.15x
reset role;
select award_xp(:'ava', 100, 'bonus', 'boost-test', null, 0, false) ->> 'xp' as boosted_xp;
do $$ begin
  if (select amount from xp_events where ref = 'boost-test') <> 115 then raise exception 'boost wrong: %', (select amount from xp_events where ref = 'boost-test'); end if;
  if level_from_xp(15200) <> 20 or level_from_xp(15199) <> 19 then raise exception 'curve wrong'; end if;
  raise notice 'ok: P1 boost 100 -> 115, Level 20 at 15200 XP';
end $$;
-- power-ups + black market
reset role;
update profiles set coins = 20000, xp = 20000 where id = :'ava';
insert into assignments(course_id, title, kind, due_at, max_score, xp_reward, status)
select c.id, 'HW ' || g, 'homework', now() + interval '1 day', 10, 50, 'published' from courses c cross join generate_series(1, 4) g where c.slug = 'o-economics';
set role authenticated; select pg_temp.as_user(:'ava');
select buy_item((select id from shop_items where kind = 'powerup' and code = 'extension'));
select use_extension((select id from assignments where title = 'HW 1'));
do $$ begin perform use_extension((select id from assignments where title = 'HW 1')); raise exception 'extended twice';
exception when others then if sqlerrm not like '%already extended%' then raise; end if; end $$;
-- owner online so alerts can happen
reset role; update profiles set last_seen_at = now() where role = 'tutor';
set role authenticated; select pg_temp.as_user(:'ava');
select black_market_status();
select black_market_buy('skip', (select id from assignments where title = 'HW 2'));
select black_market_buy('skip', (select id from assignments where title = 'HW 3'));
select black_market_buy('skip', (select id from assignments where title = 'HW 4'));
do $$ begin perform black_market_buy('skip', (select id from assignments where title = 'HW 1')); raise exception 'bought a 4th';
exception when others then if sqlerrm not like '%broken%' then raise; end if; end $$;
reset role;
do $$ declare p profiles%rowtype; n int; alerts int; begin
  select * into p from profiles where display_name = 'Ava';
  if p.coins <> 20000 - 120 - 3 * 3500 or p.xp <> 20000 - 3 * 2500 then raise exception 'wrong price: coins % xp %', p.coins, p.xp; end if;
  select count(*) into n from assignment_overrides where user_id = p.id and exempt;
  select count(*) into alerts from black_market_log where user_id = p.id and owner_alerted;
  if n <> 3 then raise exception 'expected 3 skipped, got %', n; end if;
  if (select extra_hours from assignment_overrides ao join assignments a on a.id = ao.assignment_id where a.title = 'HW 1' and ao.user_id = p.id) <> 48 then raise exception 'no extension'; end if;
  raise notice 'ok: extension +48h, 3 skips then broken, coins % xp %, owner alerted % of 3 times', p.coins, p.xp, alerts;
end $$;
-- tutor can't buy
set role authenticated; select pg_temp.as_user(:'tutor_id');
do $$ begin perform black_market_buy('bunk', gen_random_uuid()); raise exception 'tutor bought';
exception when others then if sqlerrm not like '%owner%' then raise; end if; end $$;
reset role;
-- arcade: a win pays once a day per game; losing pays nothing; unknown games rejected
set role authenticated; select pg_temp.as_user(:'ben');
select arcade_finish('ip-blaster-v4', 1500, false) ->> 'xp' as lose_xp;
select arcade_finish('ip-blaster-v4', 1500, true) ->> 'xp' as first_win_xp;
select arcade_finish('ip-blaster-v4', 1800, true) ->> 'xp' as second_win_xp;
do $$ begin perform arcade_finish('free-xp', 1, true); raise exception 'unknown game accepted';
exception when others then if sqlerrm not like '%unknown game%' then raise; end if; end $$;
reset role;
do $$ begin
  if (select count(*) from arcade_plays where xp > 0) <> 1 then raise exception 'arcade paid % times', (select count(*) from arcade_plays where xp > 0); end if;
  raise notice 'ok: arcade paid once (%), lose and repeat win paid 0', (select xp from arcade_plays where xp > 0);
end $$;
-- Trace Master: normal modes open to all; Pro only for special students; students can't flag themselves
set role authenticated; select pg_temp.as_user(:'ben');
select arcade_finish('trace-as', 900, true) ->> 'xp' as trace_as_xp;
do $$ begin perform arcade_finish('trace-pro', 900, true); raise exception 'non-special got pro';
exception when others then if sqlerrm not like '%special training only%' then raise; end if; end $$;
do $$ begin update profiles set special = true where id = auth.uid(); raise exception 'student set own special';
exception when insufficient_privilege then null; end $$;
reset role;
update profiles set special = true where id = :'ben';
set role authenticated; select pg_temp.as_user(:'ben');
select arcade_finish('trace-pro', 900, true) ->> 'xp' as trace_pro_xp;
select count(*) as others_visible from profiles where special and id <> auth.uid();
reset role;
do $$ begin
  if (select count(*) from arcade_plays where game in ('trace-as', 'trace-pro') and xp = 40) <> 2 then raise exception 'trace rewards wrong'; end if;
  raise notice 'ok: trace-as pays everyone, trace-pro only after the tutor marks the student special';
end $$;
-- Live lessons: only the tutor drives; answers checked server-side; one try; capped rewards
set role authenticated; select pg_temp.as_user(:'ben');
do $$ begin perform live_start('cpu-fde'); raise exception 'student started a lesson';
exception when others then if sqlerrm not like '%tutor only%' then raise; end if; end $$;
do $$ begin perform 1 from live_keys; if found then raise exception 'student can read keys'; end if; end $$;
reset role;
set role authenticated; select pg_temp.as_user(:'tutor_id');
select live_start('cpu-fde') as sid \gset
select live_goto(:'sid', 1);
reset role;
set role authenticated; select pg_temp.as_user(:'ben');
do $$ begin perform live_goto((select id from live_sessions where status = 'live'), 5); raise exception 'student moved the lesson';
exception when others then if sqlerrm not like '%tutor only%' then raise; end if; end $$;
select live_answer(:'sid', 1, '1'::jsonb) ->> 'xp' as right_xp;                     -- correct: +10
select live_answer(:'sid', 1, '1'::jsonb) ->> 'already' as second_try;              -- one try only
do $$ begin perform live_answer((select id from live_sessions where status = 'live'), 2, '"PC"'::jsonb); raise exception 'answered a future step';
exception when others then if sqlerrm not like '%moved on%' then raise; end if; end $$;
reset role;
set role authenticated; select pg_temp.as_user(:'tutor_id'); select live_goto(:'sid', 2); reset role;
set role authenticated; select pg_temp.as_user(:'ben');
select live_answer(:'sid', 2, '"MAR"'::jsonb) ->> 'correct' as wrong_tap;            -- wrong: no reward
reset role;
set role authenticated; select pg_temp.as_user(:'tutor_id'); select live_reveal(:'sid', true); reset role;
set role authenticated; select pg_temp.as_user(:'ben');
do $$ begin perform live_answer((select id from live_sessions where status = 'live'), 2, '"PC"'::jsonb); raise exception 'answered after reveal';
exception when others then if sqlerrm not like '%closed%' then raise; end if; end $$;
reset role;
do $$ begin
  if (select count(*) from live_answers) <> 2 then raise exception 'expected 2 answers, got %', (select count(*) from live_answers); end if;
  if (select sum(xp) from live_answers) <> 10 then raise exception 'live xp wrong: %', (select sum(xp) from live_answers); end if;
  raise notice 'ok: live lesson tutor-only controls, server-checked answers, one try, reveal closes answers';
end $$;
-- daily cap: 100 XP of live rewards
do $$ declare b uuid := '00000000-0000-0000-0000-000000000003'; s uuid; i int; begin
  for i in 1..12 loop
    insert into live_sessions(viz, step) values ('cpu-fde', 1) returning id into s;
    perform set_config('request.jwt.claim.sub', b::text, false);
    perform live_answer(s, 1, '1'::jsonb);
    update live_sessions set status = 'ended' where id = s;
  end loop;
  if (select sum(xp) from live_answers where user_id = b) > 100 then raise exception 'cap broken: %', (select sum(xp) from live_answers where user_id = b); end if;
  raise notice 'ok: live rewards capped at % XP/day', (select sum(xp) from live_answers where user_id = b);
end $$;
-- menu style switch is tutor-only
set role authenticated; select pg_temp.as_user(:'ben');
do $$ begin perform tutor_set_nav_style('classic'); raise exception 'student changed menu';
exception when others then if sqlerrm not like '%tutor only%' then raise; end if; end $$;
reset role;
-- Black Market haggling: deals come only from the server, apply once, and expire
insert into assignments(course_id, title, kind, due_at, max_score, xp_reward, status)
select course_id, 'HW haggle', kind, due_at, max_score, xp_reward, status from assignments where title = 'HW 1';
update profiles set coins = 5000, xp = 5000 where id = :'ben';
set role authenticated; select pg_temp.as_user(:'ben');
do $$ begin insert into black_market_haggles(user_id, item, discount, status) values (auth.uid(), 'skip', 50, 'deal'); raise exception 'student wrote a deal';
exception when insufficient_privilege then null; end $$;
select (black_market_status() -> 'prices' -> 'bunk' ->> 'coins') as bunk_coins;
reset role;
insert into black_market_haggles(id, user_id, item, discount, status, expires_at)
values ('aaaaaaaa-0000-0000-0000-000000000001', :'ben', 'skip', 50, 'deal', now() + interval '10 minutes'),
       ('aaaaaaaa-0000-0000-0000-000000000002', :'ben', 'skip', 25, 'deal', now() - interval '1 minute');
set role authenticated; select pg_temp.as_user(:'ben');
do $$ begin perform black_market_buy('skip', (select id from assignments where title = 'HW haggle'), 'aaaaaaaa-0000-0000-0000-000000000002'); raise exception 'expired deal used';
exception when others then if sqlerrm not like '%expired%' then raise; end if; end $$;
select black_market_buy('skip', (select id from assignments where title = 'HW haggle'), 'aaaaaaaa-0000-0000-0000-000000000001') ->> 'paid_coins' as paid_coins;
do $$ begin perform black_market_buy('skip', (select id from assignments where title = 'HW 1'), 'aaaaaaaa-0000-0000-0000-000000000001'); raise exception 'deal reused';
exception when others then if sqlerrm not like '%expired%' then raise; end if; end $$;
reset role;
do $$ declare p profiles%rowtype; begin
  select * into p from profiles where id = '00000000-0000-0000-0000-000000000003';
  if p.coins <> 5000 - 1750 or p.xp <> 5000 - 1250 then raise exception 'haggle price wrong: coins % xp %', p.coins, p.xp; end if;
  raise notice 'ok: haggled skip pass cost 1750 coins + 1250 XP (50%% off), deal single-use, expired deals rejected, bunk now % coins', (bm_price('bunk')).coins;
end $$;
-- Bunk Card: excused + counts for attendance quests/achievements
insert into class_sessions(id, title, held_on) values ('bbbbbbbb-0000-0000-0000-000000000001', 'CS session', current_date - 2);
insert into attendance(session_id, user_id, status) values ('bbbbbbbb-0000-0000-0000-000000000001', :'ben', 'absent');
update profiles set coins = 5000, xp = 5000 where id = :'ben';
set role authenticated; select pg_temp.as_user(:'ben');
select black_market_buy('bunk', 'bbbbbbbb-0000-0000-0000-000000000001') ->> 'paid_coins' as bunk_paid;
reset role;
do $$ declare st text; n int; begin
  select status into st from attendance where session_id = 'bbbbbbbb-0000-0000-0000-000000000001' and user_id = '00000000-0000-0000-0000-000000000003';
  select count(*) into n from black_market_log l join attendance x on x.session_id = l.target and x.user_id = l.user_id
   where l.user_id = '00000000-0000-0000-0000-000000000003' and l.item = 'bunk' and x.status = 'excused';
  if st <> 'excused' or n <> 1 then raise exception 'bunk not applied: % %', st, n; end if;
  raise notice 'ok: bunk cost 750 coins, absence now excused and counted for attendance achievements (%)', n;
end $$;
-- Loiterer tax: 8+ visits in a week with overdue homework = +10%
insert into assignments(course_id, title, kind, due_at, max_score, xp_reward, status)
select c.id, 'HW overdue', 'homework', now() - interval '2 days', 10, 50, 'published' from courses c
where (c.tier = 'O') = ((select tier from profiles where id = :'ben') = 'O') limit 1;
set role authenticated; select pg_temp.as_user(:'ben');
select black_market_visit() ->> 'tax' as tax_after_1_visit;
reset role;
update black_market_visits set visits = 8 where user_id = :'ben';
update profiles set coins = 5000, xp = 5000 where id = :'ben';
set role authenticated; select pg_temp.as_user(:'ben');
select black_market_visit() as visit_info;
select black_market_buy('skip', (select id from assignments where title = 'HW 2')) ->> 'paid_coins' as taxed_skip_coins;
reset role;
do $$ begin
  if (select coins from profiles where id = '00000000-0000-0000-0000-000000000003') <> 5000 - 3850 then raise exception 'tax not applied: %', (select coins from profiles where id = '00000000-0000-0000-0000-000000000003'); end if;
  raise notice 'ok: loiterer tax +10%% (skip pass 3850 coins) after 9 visits with overdue homework';
end $$;
-- Past-paper Duel: chapter-only paper questions, guide hidden until reveal, winner 2x + 50, loser 15/correct, ranking
reset role;
update profiles set tier = 'O' where id in (:'ava', :'ben');
delete from xp_events where reason = 'duel';
select id as duel_ch from chapters where course_id = (select id from courses where slug = 'o-computer-science') and number = '4' \gset
select id as closed_ch from chapters where course_id = (select id from courses where slug = 'o-computer-science') and number = '5' \gset
set role authenticated; select pg_temp.as_user(:'ava');
do $$ begin
  begin perform create_battle('1v1', null, 5, null, null, false, (select id from chapters where course_id = (select id from courses where slug = 'o-computer-science') and number = '5'), 'duel');
    raise exception 'closed chapter allowed a duel';
  exception when others then if sqlerrm not like '%not open%' then raise; end if; end;
  begin perform create_battle('2v2', null, 5, null, null, false, (select id from chapters where course_id = (select id from courses where slug = 'o-computer-science') and number = '4'), 'duel');
    raise exception '2v2 duel allowed';
  exception when others then if sqlerrm not like '%1v1%' then raise; end if; end;
end $$;
select create_battle('1v1', null, 5, null, null, false, :'duel_ch', 'duel') as dcode \gset
select id as dbid from battles where code = :'dcode' \gset
select pg_temp.as_user(:'ben'); select join_battle(:'dcode') is not null as ben_joined_duel;
select pg_temp.as_user(:'ava'); select start_battle(:'dbid');
select (battle_question(:'dbid') ->> 'guide') is null as guide_hidden_before_reveal;
reset role;
do $$ declare b uuid := (select id from battles where style = 'duel' order by created_at desc limit 1); rnd int; k int; g text;
begin
  if exists (select 1 from battle_rounds r join questions q on q.id = r.question_id where r.battle_id = b and (q.source <> 'paper' or q.chapter_id <> (select chapter_id from battles where id = b))) then
    raise exception 'duel used non-paper or other-chapter questions'; end if;
  if (select round_seconds from battles where id = b) <> 35 then raise exception 'duel round time wrong'; end if;
  for rnd in 1..5 loop
    select qk.correct into k from battle_rounds r join question_keys qk on qk.question_id = r.question_id where r.battle_id = b and r.round_no = rnd;
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
    perform answer_battle(b, k);                                   -- Ava: 5/5
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
    perform answer_battle(b, case when rnd <= 2 then k else (k + 1) % 4 end);   -- Ben: 2/5
    if rnd = 1 then
      g := battle_question(b) ->> 'guide';
      if g is null or length(g) < 20 then raise exception 'guide missing after reveal'; end if;
    end if;
    update battles set phase_started_at = now() - interval '6 seconds' where id = b;
    if tick_battle(b) <> 'live' then raise exception 'duel reveal should last 12s'; end if;
    update battles set phase_started_at = now() - interval '13 seconds' where id = b;
    perform tick_battle(b);
  end loop;
  if (select status from battles where id = b) <> 'finished' then raise exception 'duel did not finish'; end if;
  if (select sum(amount) from xp_events where reason = 'duel' and user_id = '00000000-0000-0000-0000-000000000003') is null then raise exception 'loser got nothing'; end if;
  raise notice 'ok: duel finished. ava base 5x30+50=200 -> got % XP, ben base 2x15=30 -> got % XP',
    (select reward_xp from battle_players where battle_id = b and user_id = '00000000-0000-0000-0000-000000000002'),
    (select reward_xp from battle_players where battle_id = b and user_id = '00000000-0000-0000-0000-000000000003');
end $$;
set role authenticated; select pg_temp.as_user(:'ben');
select display_name, wins, played, accuracy from duel_ranking(:'duel_ch');
do $$ begin
  perform set_duel_open((select id from chapters limit 1), true); raise exception 'student opened duels';
exception when others then if sqlerrm not like '%tutors only%' then raise; end if; end $$;
reset role;
-- Order Race: order puzzles only, order checked on the server, normal answers rejected, chat card labelled
reset role;
delete from xp_events where reason = 'race';
select id as race_ch from chapters where course_id = (select id from courses where slug = 'o-computer-science') and number = '3' \gset
set role authenticated; select pg_temp.as_user(:'ava');
select create_battle('1v1', null, 5, null, null, false, :'race_ch', 'race') as rcode \gset
select post_chat('', :'rcode') > 0 as race_posted;
select style, body, course_title from chat_messages where battle_code = :'rcode';
select pg_temp.as_user(:'ben'); select join_battle(:'rcode') is not null as ben_joined_race;
select pg_temp.as_user(:'ava'); select start_battle((select id from battles where code = :'rcode'));
select (battle_question((select id from battles where code = :'rcode')) ->> 'order') is null as order_hidden_before_reveal;
reset role;
do $$ declare b uuid := (select id from battles where style = 'race' order by created_at desc limit 1); rnd int; key int[]; n int; o jsonb;
begin
  if exists (select 1 from battle_rounds r join questions q on q.id = r.question_id where r.battle_id = b and q.source <> 'order') then
    raise exception 'race used non-order questions'; end if;
  n := (select round_count from battles where id = b);
  for rnd in 1..n loop
    select qk.order_key into key from battle_rounds r join question_keys qk on qk.question_id = r.question_id where r.battle_id = b and r.round_no = rnd;
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
    if rnd = 1 then
      begin perform answer_battle(b, -1); raise exception 'answer_battle accepted on a race';
      exception when others then if sqlerrm not like '%send an order%' then raise; end if; end;
      begin perform answer_race(b, key[1:1]); raise exception 'partial order accepted';
      exception when others then if sqlerrm not like '%place every item%' then raise; end if; end;
    end if;
    perform answer_race(b, key);                                    -- Ava: always right
    perform set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
    perform answer_race(b, key[2:] || key[1:1]);                    -- Ben: rotated, wrong
    if rnd = 1 then
      o := battle_question(b) -> 'order';
      if o is null or jsonb_array_length(o) <> cardinality(key) then raise exception 'order not revealed'; end if;
      if (select correct from battle_answers where battle_id = b and round_no = 1 and user_id = '00000000-0000-0000-0000-000000000003') then raise exception 'wrong order marked correct'; end if;
    end if;
    update battles set phase_started_at = now() - interval '6 seconds' where id = b;
    if tick_battle(b) <> 'live' then raise exception 'race reveal should last 7s'; end if;
    update battles set phase_started_at = now() - interval '8 seconds' where id = b;
    perform tick_battle(b);
  end loop;
  if (select status from battles where id = b) <> 'finished' or (select winner_team from battles where id = b) <> 1 then raise exception 'race result wrong'; end if;
  if (select count(*) from xp_events where reason = 'race') <> 2 then raise exception 'race rewards missing'; end if;
  raise notice 'ok: order race % rounds, Ava won, rewards % / % XP', n,
    (select reward_xp from battle_players where battle_id = b and team = 1), (select reward_xp from battle_players where battle_id = b and team = 2);
end $$;
-- the O Level CS exam never includes race puzzles
do $$ begin
  if exists (select 1 from questions where source = 'order' and battle_ok) then raise exception 'race puzzle leaks into battles'; end if;
end $$;
-- Bounty: streak grows once per opponent per day, claiming pays % XP + 250 coins per 5, losers reset, draws ignored
reset role;
do $$
declare ava uuid := '00000000-0000-0000-0000-000000000002'; ben uuid := '00000000-0000-0000-0000-000000000003';
        b uuid; coins0 int; cl record; s int;
begin
  delete from xp_events where reason = 'battle' and created_at::date = current_date;
  delete from bounty_events;  -- earlier tests already had Ava beat Ben today
  update profiles set win_streak = 0 where id = ava;
  update profiles set win_streak = 5, best_win_streak = 5 where id = ben;
  select coins into coins0 from profiles where id = ava;
  -- Ava beats Ben (on a 5 streak)
  insert into battles(code, mode, host_id, status, style, course_id) values ('BNTY1', '1v1', ava, 'live', 'classic', (select id from courses where slug = 'o-computer-science')) returning id into b;
  insert into battle_players(battle_id, user_id, team, score) values (b, ava, 1, 500), (b, ben, 2, 100);
  perform battle_finish(b);
  select * into cl from bounty_events where battle_id = b and kind = 'claim';
  if cl is null or cl.user_id <> ava or cl.streak <> 5 or cl.coins <> 250 or cl.xp <= 0 then raise exception 'bounty claim wrong: %', cl; end if;
  if (select win_streak from profiles where id = ben) <> 0 then raise exception 'loser streak not reset'; end if;
  if (select win_streak from profiles where id = ava) <> 1 then raise exception 'winner streak not 1'; end if;
  if not exists (select 1 from bounty_events where battle_id = b and kind = 'ended' and user_id = ben) then raise exception 'ended event missing'; end if;
  -- calling finish again pays nothing more
  perform battle_finish(b);
  if (select count(*) from bounty_events where battle_id = b and kind = 'claim') <> 1 then raise exception 'bounty paid twice'; end if;
  -- Ava beats Ben again the same day: streak must NOT grow (once per opponent per day)
  insert into battles(code, mode, host_id, status, style) values ('BNTY2', '1v1', ava, 'live', 'classic') returning id into b;
  insert into battle_players(battle_id, user_id, team, score) values (b, ava, 1, 500), (b, ben, 2, 100);
  perform battle_finish(b);
  if (select win_streak from profiles where id = ava) <> 1 then raise exception 'streak farmed on same opponent'; end if;
  -- a draw changes nothing
  update profiles set win_streak = 4 where id = ben;
  insert into battles(code, mode, host_id, status, style) values ('BNTY3', '1v1', ava, 'live', 'classic') returning id into b;
  insert into battle_players(battle_id, user_id, team, score) values (b, ava, 1, 200), (b, ben, 2, 200);
  perform battle_finish(b);
  if (select win_streak from profiles where id = ben) <> 4 then raise exception 'draw changed a streak'; end if;
  raise notice 'ok: bounty claimed (+% XP, +% coins), streak once per opponent per day, draws ignored', cl.xp, cl.coins;
end $$;
set role authenticated; select pg_temp.as_user(:'ava');
select display_name, win_streak from most_wanted();
reset role;
