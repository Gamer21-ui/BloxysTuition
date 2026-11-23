-- Smoke test for the game logic. Run after stubs + migrations + seed.
\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-000000000001', '{"full_name":"Tutor","provider_id":"1"}');
insert into auth.users values ('00000000-0000-0000-0000-000000000002', '{"full_name":"Ava","provider_id":"2"}');
insert into auth.users values ('00000000-0000-0000-0000-000000000003', '{"full_name":"Ben","provider_id":"3"}');
insert into auth.users values ('00000000-0000-0000-0000-000000000004', '{"full_name":"Cara","provider_id":"4"}');
select display_name, role, status from profiles order by display_name;
update profiles set status='approved' where role='student';
update profiles set tier='AS' where display_name='Cara';

-- act as Ava (student)
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select count(*) as courses_visible from courses;
select count(*) as keys_visible_should_be_0 from question_keys;
do $$ begin update profiles set xp = 99999 where id = auth.uid(); raise exception 'xp update allowed!'; exception when insufficient_privilege then raise notice 'ok: cannot edit xp'; end $$;
update profiles set theme='retro' where id = auth.uid();

-- take a quiz with all answers correct (read keys as postgres to build answers)
reset role;
create temp table t_att as select 1;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select (start_quiz((select id from quizzes where title='Chapter 1 quiz' and course_id=(select id from courses where slug='o-computer-science')))->>'attempt_id') as att \gset
reset role;
select jsonb_object_agg(k.question_id::text, k.correct) as ans from quiz_attempts a, unnest(a.question_ids) qid join question_keys k on k.question_id=qid where a.id = :'att' \gset
update quiz_attempts set started_at = now() - interval '60 seconds' where id = :'att';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select submit_quiz(:'att', :'ans'::jsonb) - 'results' as result;
-- retake perfect again: should give 0 XP
select (start_quiz((select id from quizzes where title='Chapter 1 quiz' and course_id=(select id from courses where slug='o-computer-science')))->>'attempt_id') as att2 \gset
reset role; update quiz_attempts set started_at = now() - interval '60 seconds' where id = :'att2';
select jsonb_object_agg(k.question_id::text, k.correct) as ans2 from quiz_attempts a, unnest(a.question_ids) qid join question_keys k on k.question_id=qid where a.id = :'att2' \gset
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select (submit_quiz(:'att2', :'ans2'::jsonb))->>'xp' as retake_xp_should_be_0;
-- too-fast attempt gets flagged
select (start_quiz((select id from quizzes where title='Chapter 2 quiz' and course_id=(select id from courses where slug='o-computer-science')))->>'attempt_id') as att3 \gset
select submit_quiz(:'att3', '{}'::jsonb)->>'flagged' as fast_flagged;
reset role;
select display_name, xp, coins, streak, level_from_xp(xp) lvl from profiles where display_name='Ava';
select a.title from user_achievements u join achievements a on a.id=u.achievement_id join profiles p on p.id=u.user_id where p.display_name='Ava';
select c.title, p.progress, p.completed_at is not null done from challenge_progress p join challenges c on c.id=p.challenge_id join profiles pr on pr.id=p.user_id where pr.display_name='Ava';

-- Cara (AS) doing O content: multiplier should be 1. Ava is O: test the boost by making a course AS-level
update courses set tier='A' where slug='o-economics';
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select (start_quiz((select id from quizzes where title='Chapter 1 quiz' and course_id=(select id from courses where slug='o-economics')))->>'attempt_id') as att4 \gset
reset role; update quiz_attempts set started_at = now() - interval '60 seconds' where id = :'att4';
select jsonb_object_agg(k.question_id::text, k.correct) as ans4 from quiz_attempts a, unnest(a.question_ids) qid join question_keys k on k.question_id=qid where a.id = :'att4' \gset
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select r->>'xp' as xp, r->>'multiplier' as mult_should_be_1_5 from (select submit_quiz(:'att4', :'ans4'::jsonb) r) s;
reset role; update courses set tier='O' where slug='o-economics';

-- battle 1v1: Ava hosts, Ben joins
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select create_battle('1v1', (select id from courses where slug='o-computer-science'), 3) as code \gset
select id as bid from battles where code = :'code' \gset
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select join_battle(:'code') is not null as joined;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select start_battle(:'bid');
select battle_question(:'bid')->>'prompt' as q1;
-- Ben cannot see Ava's answer before reveal
reset role;
select r.round_no, k.correct as key from battle_rounds r join question_keys k on k.question_id=r.question_id where r.battle_id=:'bid' order by 1;
\set ON_ERROR_STOP 1
do $$
declare b uuid := (select id from battles order by created_at desc limit 1); rnd int; k int;
begin
  for rnd in 1..3 loop
    select qk.correct into k from battle_rounds r join question_keys qk on qk.question_id=r.question_id where r.battle_id=b and r.round_no=rnd;
    perform set_config('role','authenticated',true);
    perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
    perform answer_battle(b, k);            -- Ava always right
    perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
    perform answer_battle(b, (k+1)%4);      -- Ben always wrong -> both answered -> reveal
    perform set_config('role','postgres',true);
    update battles set phase_started_at = now() - interval '6 seconds' where id=b;
    perform set_config('role','authenticated',true);
    perform tick_battle(b);
    perform set_config('role','postgres',true);
  end loop;
end $$;
select status, winner_team, current_round from battles where id=:'bid';
select pr.display_name, bp.team, bp.score from battle_players bp join profiles pr on pr.id=bp.user_id where battle_id=:'bid';
select display_name, xp, coins from profiles where role='student' order by xp desc;

-- tutor tools
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select tutor_award('00000000-0000-0000-0000-000000000003', 100, 10, 'Helped a classmate')->>'xp' as bonus;
reset role; insert into class_sessions(id,title) values ('11111111-1111-1111-1111-111111111111','Monday CS');
set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select mark_attendance('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000004','present');
select mark_attendance('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000004','present');
select id, display_name, level, value from get_leaderboard('xp', 10);
-- a student calling tutor_award must fail
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
do $$ begin perform tutor_award(auth.uid(), 9999, 0, 'cheat'); raise exception 'cheat allowed!'; exception when others then raise notice 'ok: %', sqlerrm; end $$;
do $$ begin perform award_xp(auth.uid(), 9999, 'cheat'); raise exception 'award_xp callable!'; exception when insufficient_privilege then raise notice 'ok: award_xp not callable'; end $$;
select count(*) as notifications from notifications;
reset role;
select display_name, xp, coins, streak from profiles order by display_name;
