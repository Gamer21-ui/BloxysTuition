-- Live polls: the tutor posts a question, it pops up for every student online, results update live.
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 2 and 300),
  options jsonb not null,                       -- ["Yes", "No", ...]
  counts int[] not null,                        -- live tally, one per option (kept by vote_poll)
  correct int,                                  -- optional: shown once the poll is closed
  status text not null default 'open' check (status in ('open', 'closed')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);
create table if not exists poll_votes (
  poll_id uuid not null references polls(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  choice int not null,
  voted_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);
alter table polls enable row level security;
alter table poll_votes enable row level security;
drop policy if exists polls_select on polls;
create policy polls_select on polls for select using (is_approved());
drop policy if exists poll_votes_select on poll_votes;
create policy poll_votes_select on poll_votes for select using (user_id = auth.uid() or is_tutor());
grant select on polls, poll_votes to authenticated;
grant all on polls, poll_votes to service_role;

create or replace function create_poll(p_question text, p_options text[], p_correct int default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare opts text[]; id uuid; n int;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  select array_agg(left(btrim(o), 120)) into opts from unnest(p_options) o where btrim(o) <> '';
  n := coalesce(array_length(opts, 1), 0);
  if n < 2 or n > 6 then raise exception 'a poll needs 2 to 6 options'; end if;
  if p_correct is not null and (p_correct < 0 or p_correct >= n) then raise exception 'bad correct option'; end if;
  update polls set status = 'closed', closed_at = now() where status = 'open'; -- one live poll at a time
  insert into polls(question, options, counts, correct, created_by)
  values (left(btrim(p_question), 300), to_jsonb(opts), array_fill(0, array[n]), p_correct, auth.uid())
  returning polls.id into id;
  return id;
end $$;

create or replace function vote_poll(p_poll uuid, p_choice int) returns void
language plpgsql security definer set search_path = public as $$
declare pl polls%rowtype; prev int;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  select * into pl from polls where id = p_poll for update;
  if not found or pl.status <> 'open' then raise exception 'this poll is closed'; end if;
  if p_choice < 0 or p_choice >= array_length(pl.counts, 1) then raise exception 'bad option'; end if;
  select choice into prev from poll_votes where poll_id = p_poll and user_id = auth.uid();
  if prev = p_choice then return; end if;
  if prev is not null then pl.counts[prev + 1] := greatest(0, pl.counts[prev + 1] - 1); end if;
  pl.counts[p_choice + 1] := pl.counts[p_choice + 1] + 1;
  insert into poll_votes(poll_id, user_id, choice) values (p_poll, auth.uid(), p_choice)
  on conflict (poll_id, user_id) do update set choice = excluded.choice, voted_at = now();
  update polls set counts = pl.counts where id = p_poll;
end $$;

create or replace function close_poll(p_poll uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  update polls set status = 'closed', closed_at = now() where id = p_poll and status = 'open';
end $$;

revoke all on function create_poll(text, text[], int) from public, anon;
revoke all on function vote_poll(uuid, int) from public, anon;
revoke all on function close_poll(uuid) from public, anon;
grant execute on function create_poll(text, text[], int) to authenticated;
grant execute on function vote_poll(uuid, int) to authenticated;
grant execute on function close_poll(uuid) to authenticated;

do $$ declare t text; begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['polls', 'poll_votes'] loop
      begin execute format('alter publication supabase_realtime add table %I', t);
      exception when duplicate_object then null; end;
    end loop;
  end if;
end $$;
