-- Exam mode + mistakes deck. Runs after smoke.sql (users exist and are approved).
\set ON_ERROR_STOP 1
reset role;
-- exams start locked; the tutor opens them
select count(*) as exams_locked_should_be_4 from quizzes where kind = 'exam' and status = 'locked';
update quizzes set status = 'published' where kind = 'exam';
-- Ben sits the Accounting exam and answers everything wrong
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select (start_quiz((select id from quizzes where kind='exam' and course_id=(select id from courses where slug='o-accounting')))->>'attempt_id') as ex \gset
reset role;
select array_length(question_ids,1) as exam_questions_should_be_40 from quiz_attempts where id = :'ex';
select jsonb_object_agg(k.question_id::text, (k.correct + 1) % 4) as wrong from quiz_attempts a, unnest(a.question_ids) qid join question_keys k on k.question_id=qid where a.id = :'ex' \gset
update quiz_attempts set started_at = now() - interval '20 minutes' where id = :'ex';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select submit_quiz(:'ex', :'wrong'::jsonb) - 'results' as exam_result;
select count(*) as deck_size_should_be_40 from review_items;
do $$ begin perform start_quiz((select id from quizzes where kind='review' and course_id=(select id from courses where slug='o-accounting'))); raise exception 'review started too early!'; exception when others then if sqlerrm like '%nothing to review%' then raise notice 'ok: nothing due yet'; else raise; end if; end $$;

-- a day later: review 10 items, all right
reset role;
update review_items set due_at = now() - interval '1 minute';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select (start_quiz((select id from quizzes where kind='review' and course_id=(select id from courses where slug='o-accounting')))->>'attempt_id') as rv \gset
reset role;
select array_length(question_ids,1) as review_questions_should_be_10 from quiz_attempts where id = :'rv';
select jsonb_object_agg(k.question_id::text, k.correct) as right_ans from quiz_attempts a, unnest(a.question_ids) qid join question_keys k on k.question_id=qid where a.id = :'rv' \gset
update quiz_attempts set started_at = now() - interval '2 minutes' where id = :'rv';
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
select (submit_quiz(:'rv', :'right_ans'::jsonb) - 'results')->>'xp' as review_xp_should_be_50;
select box, count(*) from review_items group by box order by box;
reset role;
-- push those 10 through box 1 and box 2 to mastery
do $$ declare i int; a uuid; ans jsonb; begin
  for i in 1..2 loop
    update review_items set due_at = now() - interval '1 minute' where box = i;
    update review_items set due_at = now() + interval '1 day' where box = 0;
    perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
    a := (start_quiz((select id from quizzes where kind='review' and course_id=(select id from courses where slug='o-accounting')))->>'attempt_id')::uuid;
    select jsonb_object_agg(k.question_id::text, k.correct) into ans from quiz_attempts t, unnest(t.question_ids) qid join question_keys k on k.question_id=qid where t.id = a;
    update quiz_attempts set started_at = now() - interval '2 minutes' where id = a;
    raise notice 'round % mastered: %', i, submit_quiz(a, ans)->'review_mastered';
  end loop;
end $$;
select count(*) as deck_after_mastery_should_be_30 from review_items;
-- students can only see their own deck
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select count(*) as ava_sees_bens_items_should_be_0 from review_items;
reset role;
