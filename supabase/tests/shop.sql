-- Coin shop. Runs after smoke.sql / exam_review.sql.
\set ON_ERROR_STOP 1
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select coins as ava_coins_before from profiles where id = auth.uid();
do $$ begin perform buy_item((select id from shop_items where kind='hat' and code='beanie')); raise exception 'bought without coins!';
exception when others then if sqlerrm like '%not enough coins%' then raise notice 'ok: not enough coins'; else raise; end if; end $$;
reset role; update profiles set coins = 1000 where display_name = 'Ava'; set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select buy_item((select id from shop_items where kind='hat' and code='beanie'))->>'coins' as coins_after_beanie_should_be_850;
do $$ begin perform buy_item((select id from shop_items where kind='hat' and code='beanie')); raise exception 'bought twice!';
exception when others then if sqlerrm like '%already own%' then raise notice 'ok: cannot buy twice'; else raise; end if; end $$;
do $$ begin perform buy_item((select id from shop_items where kind='frame' and code='diamond')); raise exception 'level lock ignored!';
exception when others then if sqlerrm like '%reach level%' then raise notice 'ok: level locked'; else raise; end if; end $$;
select equip_item('hat', 'beanie');
select blocky->>'hat' as hat_should_be_beanie from profiles where id = auth.uid();
do $$ begin perform equip_item('hat', 'wizard'); raise exception 'equipped unowned!';
exception when others then if sqlerrm like '%do not own%' then raise notice 'ok: cannot equip unowned'; else raise; end if; end $$;
do $$ begin update profiles set blocky = '{"hat":"wizard"}' where id = auth.uid(); raise exception 'direct blocky write allowed!';
exception when insufficient_privilege then raise notice 'ok: cannot write avatar directly'; end $$;
update profiles set theme = 'gamer' where id = auth.uid();  -- still allowed
select buy_item((select id from shop_items where kind='name_style' and code='ocean')) is not null as bought_ocean;
select equip_item('name_style', 'ocean');
select name_style as card_name_style_should_be_ocean from profile_cards(array['00000000-0000-0000-0000-000000000002'::uuid]);
select buy_item((select id from shop_items where code='streak-freeze'))->>'coins' as f1, buy_item((select id from shop_items where code='streak-freeze'))->>'coins' as f2;
do $$ begin perform buy_item((select id from shop_items where code='streak-freeze')); raise exception 'third freeze allowed!';
exception when others then if sqlerrm like '%only hold 2%' then raise notice 'ok: max 2 freezes'; else raise; end if; end $$;
-- missed one day: a freeze is used and the streak continues
reset role;
update profiles set streak = 5, last_study_date = today_local() - 2 where display_name = 'Ava';
select award_xp('00000000-0000-0000-0000-000000000002', 10, 'test') ->> 'xp' as xp;
select streak as streak_should_be_6, streak_freezes as freezes_should_be_1 from profiles where display_name = 'Ava';
-- missed three days with one freeze: streak resets
update profiles set streak = 6, last_study_date = today_local() - 4 where display_name = 'Ava';
select award_xp('00000000-0000-0000-0000-000000000002', 10, 'test') ->> 'xp' as xp;
select streak as streak_should_be_1, streak_freezes as freezes_still_1 from profiles where display_name = 'Ava';
select sum(coins) as shop_spend_logged_should_be_neg460 from xp_events where reason = 'shop';
-- owner exclusives
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
select count(*) as student_sees_owner_items_should_be_0 from shop_items where tutor_only;
do $$ begin perform equip_item('frame', 'owner'); raise exception 'student equipped owner frame!';
exception when others then if sqlerrm like '%do not own%' then raise notice 'ok: student cannot equip owner frame'; else raise; end if; end $$;
reset role;
do $$ begin
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
  set local role authenticated;
  perform buy_item((select id from shop_items where tutor_only limit 1));
  raise exception 'student bought owner item!';
exception when others then if sqlerrm like '%not available%' then raise notice 'ok: owner items not for sale'; else raise; end if; end $$;
set role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
select count(*) as tutor_sees_owner_items_should_be_5 from shop_items where tutor_only;
select equip_item('frame', 'owner'), equip_item('name_style', 'owner'), equip_item('hat', 'owner_crown'), equip_item('title', 't-owner');
select frame, name_style, blocky->>'hat' as hat, title from profiles where id = auth.uid();
reset role;
