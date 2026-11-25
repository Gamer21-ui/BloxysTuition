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
