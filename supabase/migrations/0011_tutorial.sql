-- Site tour. Everyone with tutorial_version below the site's version sees it (new students start at 0).
-- The tutor can bump the site version to show it to everyone again.
create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  tutorial_version int not null default 1,
  tutorial_launched_at timestamptz
);
insert into site_settings(id) values (1) on conflict (id) do nothing;
alter table site_settings enable row level security;
drop policy if exists site_settings_select on site_settings;
create policy site_settings_select on site_settings for select using (is_approved());
grant select on site_settings to authenticated;
grant all on site_settings to service_role;

-- existing accounts start as "seen" so the tutor decides when they get it; new sign-ups start at 0 and see it
do $$ begin
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'tutorial_version') then
    alter table profiles add column tutorial_version int not null default 0;
    update profiles set tutorial_version = 1;
  end if;
end $$;

-- student finished (or skipped) the tour
create or replace function finish_tutorial() returns void
language plpgsql security definer set search_path = public as $$
begin
  update profiles set tutorial_version = (select tutorial_version from site_settings where id = 1) where id = auth.uid();
end $$;

-- tutor: show the tour to everyone again
create or replace function relaunch_tutorial() returns int
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  update site_settings set tutorial_version = tutorial_version + 1, tutorial_launched_at = now() where id = 1 returning tutorial_version into v;
  update profiles set tutorial_version = v where id = auth.uid(); -- the tutor isn't shown it
  return v;
end $$;

revoke all on function finish_tutorial() from public, anon;
revoke all on function relaunch_tutorial() from public, anon;
grant execute on function finish_tutorial() to authenticated;
grant execute on function relaunch_tutorial() to authenticated;

-- live: students who are already on the site get the tour as soon as the tutor launches it
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin execute 'alter publication supabase_realtime add table site_settings';
    exception when duplicate_object then null; end;
  end if;
end $$;
