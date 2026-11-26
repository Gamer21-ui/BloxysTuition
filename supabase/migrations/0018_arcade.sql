-- 🕹️ Arcade: learning mini-games. A win pays XP + coins once per game per day; losing costs nothing.
-- Every play is logged (score, win/lose) so the tutor can see who's practising what.
create table if not exists arcade_plays (
  id bigserial primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  game text not null,
  score int not null default 0,
  success boolean not null default false,
  xp int not null default 0,
  coins int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists arcade_user_game on arcade_plays(user_id, game, created_at desc);
alter table arcade_plays enable row level security;
drop policy if exists arcade_select on arcade_plays;
create policy arcade_select on arcade_plays for select using (user_id = auth.uid() or is_tutor());
grant select on arcade_plays to authenticated;
grant all on arcade_plays to service_role;
grant usage, select on sequence arcade_plays_id_seq to service_role;

create or replace function arcade_finish(p_game text, p_score int, p_success boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare paid_today boolean; xp_gain int := 0; coin_gain int := 0; res jsonb;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_game not in ('ip-blaster-v4', 'ip-blaster-v6', 'cpu-commander', 'embedded-sorter') then raise exception 'unknown game'; end if;
  -- one rewarded win per game per day (Mauritius time), so it can't be farmed
  select exists (select 1 from arcade_plays where user_id = auth.uid() and game = p_game and xp > 0
                 and (created_at at time zone 'Indian/Mauritius')::date = today_local()) into paid_today;
  if coalesce(p_success, false) and not paid_today then
    res := award_xp(auth.uid(), 40, 'arcade', p_game, null, 10, true);
    xp_gain := coalesce((res->>'xp')::int, 0);
    coin_gain := 10;
  end if;
  insert into arcade_plays(user_id, game, score, success, xp, coins)
  values (auth.uid(), p_game, greatest(0, least(coalesce(p_score, 0), 100000)), coalesce(p_success, false), xp_gain, coin_gain);
  return jsonb_build_object('xp', xp_gain, 'coins', coin_gain, 'already_paid_today', paid_today and coalesce(p_success, false));
end $$;
revoke all on function arcade_finish(text, int, boolean) from public, anon;
grant execute on function arcade_finish(text, int, boolean) to authenticated;
