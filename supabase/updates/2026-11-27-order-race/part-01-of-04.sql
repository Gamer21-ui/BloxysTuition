-- Order Race update (27 Nov 2026). Part 1 of 4: tables and battle functions. Needs the Past-paper Duel update first. Run the parts in order. Safe to run again.
-- ⚡ Order Race: an arcade battle where each round is "put these in the right order" (e.g. PC → MAR → MDR → CIR).
-- Fastest correct order scores most. Challenge someone in chat like a normal battle.

alter table questions drop constraint if exists questions_source_check;
alter table questions add constraint questions_source_check check (source in ('quiz', 'paper', 'order'));
alter table question_keys add column if not exists order_key int[];      -- option indexes in the correct order
alter table battle_answers add column if not exists order_given int[];
alter table battles drop constraint if exists battles_style_check;
alter table battles add constraint battles_style_check check (style in ('classic', 'ranked', 'pressure', 'duel', 'race'));
alter table chat_messages add column if not exists style text;

create or replace function create_battle(p_mode text, p_course uuid default null, p_rounds int default 5, p_tier tier default null,
                                         p_subject text default null, p_both boolean default false, p_chapter uuid default null,
                                         p_style text default 'classic')
returns text language plpgsql security definer set search_path = public as $$
declare c text; b uuid; lvl tier; subj text := nullif(btrim(coalesce(p_subject, '')), ''); both_lv boolean := coalesce(p_both, false);
        crs uuid := p_course; chap uuid := p_chapter; sty text := coalesce(p_style, 'classic'); rounds int; secs int := 20; ch chapters%rowtype;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_mode not in ('1v1','2v2') then raise exception 'bad mode'; end if;
  if sty not in ('classic', 'ranked', 'pressure', 'duel', 'race') then raise exception 'bad style'; end if;
  if sty = 'ranked' then chap := null; end if;          -- ranked covers a whole subject or level, not one easy chapter
  rounds := least(greatest(coalesce(p_rounds, 5), 3), 10);
  if sty = 'ranked' then rounds := greatest(rounds, 5); end if;
  if sty = 'duel' then
    if p_mode <> '1v1' then raise exception 'duels are 1v1'; end if;
    select * into ch from chapters where id = chap;
    if not found then raise exception 'pick a chapter for the duel'; end if;
    if not is_tutor() and not (ch.duel_open and is_live(ch.status, ch.release_at)) then
      raise exception 'duels are not open for this chapter yet';
    end if;
    rounds := case when coalesce(p_rounds, 5) >= 7 then 7 else 5 end;
    if (select count(*) from questions where chapter_id = chap and source = 'paper') < rounds then
      raise exception 'not enough past-paper questions for this chapter yet';
    end if;
    secs := 35;                                           -- exam questions need reading time
  elsif sty = 'race' then
    if p_course is null and chap is null then raise exception 'pick a subject for the race'; end if;
    rounds := least(greatest(coalesce(p_rounds, 5), 3), 7);
    if (select count(*) from questions where source = 'order'
          and (case when chap is not null then chapter_id = chap else course_id = p_course end)) < 3 then
      raise exception 'no Order Race puzzles for this topic yet';
    end if;
    if chap is not null and not is_tutor() and not exists (select 1 from chapters where id = chap and is_live(status, release_at)) then
      raise exception 'chapter locked';
    end if;
    secs := 30;
  end if;
  if chap is not null then
    select course_id into crs from chapters where id = chap;
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
  insert into battles(code, mode, course_id, chapter_id, host_id, round_count, round_seconds, tier, subject, both_levels, style)
  values (c, p_mode, crs, chap, auth.uid(), rounds, secs, lvl, subj, both_lv, sty)
  returning id into b;
  insert into battle_players(battle_id, user_id, team) values (b, auth.uid(), 1);
  if sty not in ('duel', 'race') then perform bring_party(b, 1); end if;
  return c;
end $$;
revoke all on function create_battle(text, uuid, int, tier, text, boolean, uuid, text) from public, anon;
grant execute on function create_battle(text, uuid, int, tier, text, boolean, uuid, text) to authenticated;

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
    where (case when b.style = 'duel' then qq.chapter_id = b.chapter_id and qq.source = 'paper'
                when b.style = 'race' then qq.source = 'order' and (case when b.chapter_id is not null then qq.chapter_id = b.chapter_id
                     else qq.course_id = b.course_id and exists (select 1 from chapters c2 where c2.id = qq.chapter_id and is_live(c2.status, c2.release_at)) end)
                else qq.battle_ok and qq.source = 'quiz' and
                  (case when b.chapter_id is not null then qq.chapter_id = b.chapter_id
                        when b.course_id is not null then qq.course_id = b.course_id
                        else (b.tier is null or cc.tier = b.tier or (b.both_levels and cc.tier = 'AS'))
                             and (b.subject is null or subject_of(cc.slug) = b.subject) end) end)
    order by random() limit b.round_count
  loop
    i := i + 1;
    insert into battle_rounds(battle_id, round_no, question_id) values (b.id, i, q);
  end loop;
  if i = 0 then raise exception 'no questions available for this level yet'; end if;
  update battles set status = 'live', round_count = i, current_round = 1, phase = 'question',
    phase_started_at = now() where id = b.id;
end $$;

create or replace function battle_question(p_battle uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('round', r.round_no, 'id', q.id, 'prompt', q.prompt, 'options', q.options, 'correct', r.correct,
           'ref', q.ref,
           'guide', case when r.correct is not null then k.guide end,
           'explanation', case when r.correct is not null and b.style in ('duel', 'race') then q.explanation end,
           'order', case when r.correct is not null and b.style = 'race' then to_jsonb(k.order_key) end)
  from battles b join battle_rounds r on r.battle_id = b.id and r.round_no = b.current_round
  join questions q on q.id = r.question_id
  left join question_keys k on k.question_id = q.id
  where b.id = p_battle and exists(select 1 from battle_players p where p.battle_id = b.id and p.user_id = auth.uid());
$$;

create or replace function tick_battle(p_battle uuid) returns text
language plpgsql security definer set search_path = public as $$
declare b battles%rowtype;
begin
  select * into b from battles where id = p_battle for update;
  if not found or b.status <> 'live' then return coalesce(b.status, 'missing'); end if;
  if not exists(select 1 from battle_players where battle_id = b.id and user_id = auth.uid()) then
    return b.status;
  end if;
  if b.phase = 'question' and now() > coalesce(b.phase_ends_at, b.phase_started_at + make_interval(secs => b.round_seconds)) + interval '1 second' then
    perform battle_reveal(b.id);
  elsif b.phase = 'reveal' and now() > b.phase_started_at + (case b.style when 'duel' then interval '12 seconds' when 'race' then interval '7 seconds' else interval '5 seconds' end) then
    if b.current_round >= b.round_count then
      perform battle_finish(b.id);
      return 'finished';
    end if;
    update battles set current_round = current_round + 1, phase = 'question', phase_started_at = now(), phase_ends_at = null where id = b.id;
  end if;
  return 'live';
end $$;

