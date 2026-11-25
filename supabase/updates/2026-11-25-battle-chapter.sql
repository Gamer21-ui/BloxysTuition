-- Battles limited to one chapter (25 Nov 2026). Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Battles can be limited to one chapter of a course (e.g. O Level CS · 4 Software).
alter table battles add column if not exists chapter_id uuid references chapters(id) on delete set null;

drop function if exists create_battle(text, uuid, int, tier, text, boolean);
create or replace function create_battle(p_mode text, p_course uuid default null, p_rounds int default 5, p_tier tier default null,
                                         p_subject text default null, p_both boolean default false, p_chapter uuid default null)
returns text language plpgsql security definer set search_path = public as $$
declare c text; b uuid; lvl tier; subj text := nullif(btrim(coalesce(p_subject, '')), ''); both_lv boolean := coalesce(p_both, false);
        crs uuid := p_course;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_mode not in ('1v1','2v2') then raise exception 'bad mode'; end if;
  if p_chapter is not null then
    select course_id into crs from chapters where id = p_chapter;
    if crs is null then raise exception 'chapter not found'; end if;
  end if;
  if crs is not null then
    subj := null; both_lv := false;
    select tier into lvl from courses where id = crs;
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
  insert into battles(code, mode, course_id, chapter_id, host_id, round_count, tier, subject, both_levels)
  values (c, p_mode, crs, p_chapter, auth.uid(), least(greatest(coalesce(p_rounds, 5), 3), 10), lvl, subj, both_lv)
  returning id into b;
  insert into battle_players(battle_id, user_id, team) values (b, auth.uid(), 1);
  perform bring_party(b, 1);
  return c;
end $$;
revoke all on function create_battle(text, uuid, int, tier, text, boolean, uuid) from public, anon;
grant execute on function create_battle(text, uuid, int, tier, text, boolean, uuid) to authenticated;

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
      and (case when b.chapter_id is not null then qq.chapter_id = b.chapter_id
                when b.course_id is not null then qq.course_id = b.course_id
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
