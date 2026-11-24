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
