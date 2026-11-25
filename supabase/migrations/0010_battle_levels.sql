-- Battles can mix AS + A Level, and a mixed battle can be limited to one subject (e.g. AS + A Economics).
alter table battles add column if not exists subject text;
alter table battles add column if not exists both_levels boolean not null default false;

drop function if exists create_battle(text, uuid, int, tier);
create or replace function create_battle(p_mode text, p_course uuid default null, p_rounds int default 5, p_tier tier default null,
                                         p_subject text default null, p_both boolean default false)
returns text language plpgsql security definer set search_path = public as $$
declare c text; b uuid; lvl tier; subj text := nullif(btrim(coalesce(p_subject, '')), ''); both_lv boolean := coalesce(p_both, false);
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_mode not in ('1v1','2v2') then raise exception 'bad mode'; end if;
  if p_course is not null then
    subj := null; both_lv := false;
    select tier into lvl from courses where id = p_course;
  else
    lvl := case when both_lv then 'A'::tier else coalesce(p_tier, (select tier from profiles where id = auth.uid())) end;
    if lvl = 'O' then both_lv := false; end if;
    if subj is not null and not exists (
        select 1 from courses cc where cc.active and subject_of(cc.slug) = subj
          and (cc.tier = lvl or (both_lv and cc.tier = 'AS'))) then
      raise exception 'no such subject at that level';
    end if;
  end if;
  loop
    c := upper(substr(md5(random()::text), 1, 5));
    exit when not exists (select 1 from battles where code = c);
  end loop;
  insert into battles(code, mode, course_id, host_id, round_count, tier, subject, both_levels)
  values (c, p_mode, p_course, auth.uid(), least(greatest(coalesce(p_rounds, 5), 3), 10), lvl, subj, both_lv)
  returning id into b;
  insert into battle_players(battle_id, user_id, team) values (b, auth.uid(), 1);
  perform bring_party(b, 1);
  return c;
end $$;
revoke all on function create_battle(text, uuid, int, tier, text, boolean) from public, anon;
grant execute on function create_battle(text, uuid, int, tier, text, boolean) to authenticated;

create or replace function start_battle(p_battle uuid) returns void
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; i int := 0; q uuid;
begin
  select * into b from battles where id = p_battle for update;
  if b.host_id <> auth.uid() then raise exception 'only the host can start'; end if;
  if b.status <> 'lobby' then raise exception 'already started'; end if;
  if (select count(distinct team) from battle_players where battle_id = b.id) < 2 then
    raise exception 'both teams need at least one player';
  end if;
  for q in
    select qq.id from questions qq join question_keys k on k.question_id = qq.id join courses cc on cc.id = qq.course_id
    where qq.battle_ok
      and (case when b.course_id is not null then qq.course_id = b.course_id
                else (b.tier is null or cc.tier = b.tier or (b.both_levels and cc.tier = 'AS'))
                     and (b.subject is null or subject_of(cc.slug) = b.subject) end)
    order by random() limit b.round_count
  loop
    i := i + 1;
    insert into battle_rounds(battle_id, round_no, question_id) values (b.id, i, q);
  end loop;
  if i = 0 then raise exception 'no questions available for this level yet'; end if;
  update battles set status = 'live', round_count = i, current_round = 1, phase = 'question',
    phase_started_at = now() where id = b.id;
end $$;

-- chat battle requests describe mixed battles properly ("AS + A Level · Economics")
create or replace function post_chat(p_body text, p_battle_code text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype; mid bigint; body text := btrim(coalesce(p_body, ''));
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if (select count(*) from chat_messages where user_id = auth.uid() and created_at > now() - interval '30 seconds') >= 6 then
    raise exception 'slow down a bit';
  end if;
  if p_battle_code is not null then
    select * into b from battles where code = upper(p_battle_code);
    if not found or b.status <> 'lobby' then raise exception 'that battle is not open'; end if;
    insert into chat_messages(user_id, body, kind, battle_code, mode, tier, course_title)
    values (auth.uid(), coalesce(nullif(body, ''), 'Join my battle!'), 'battle', b.code, b.mode, b.tier,
            coalesce((select title from courses where id = b.course_id),
                     case when b.both_levels then 'AS + A Level ' else '' end || coalesce(initcap(replace(b.subject, '-', ' ')), 'Mixed')))
    returning id into mid;
  else
    if body = '' then raise exception 'empty message'; end if;
    insert into chat_messages(user_id, body) values (auth.uid(), left(body, 500)) returning id into mid;
  end if;
  return mid;
end $$;
