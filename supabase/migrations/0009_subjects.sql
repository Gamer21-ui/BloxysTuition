-- Each student picks the subjects they take (e.g. {economics, business}). NULL = not chosen yet.
alter table profiles add column if not exists subjects text[];

-- 'as-economics' -> 'economics', 'o-accounting' -> 'accounting'
create or replace function subject_of(slug text) returns text language sql immutable as $$
  select regexp_replace(slug, '^(o|as|a)-', '');
$$;

-- Students save their own subjects. Only subjects that exist for their level are accepted.
create or replace function set_my_subjects(p_subjects text[]) returns text[]
language plpgsql security definer set search_path = public as $$
declare me profiles%rowtype; clean text[];
begin
  select * into me from profiles where id = auth.uid();
  if not found or me.status <> 'approved' then raise exception 'not approved'; end if;
  select array_agg(distinct s order by s) into clean
  from unnest(coalesce(p_subjects, '{}')) s
  where exists (select 1 from courses c where c.active and subject_of(c.slug) = s
                and (case when me.tier = 'O' then c.tier = 'O' else c.tier in ('AS', 'A') end));
  if clean is null or array_length(clean, 1) = 0 then raise exception 'pick at least one subject'; end if;
  update profiles set subjects = clean where id = me.id;
  return clean;
end $$;
revoke all on function set_my_subjects(text[]) from public, anon;
grant execute on function set_my_subjects(text[]) to authenticated;
