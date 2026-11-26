-- 🌟 Special Training + 🧮 Trace Master.
-- profiles.special: set by the tutor only (students have no UPDATE grant on it, and other
-- students can't read it because profiles RLS only shows your own row).
alter table profiles add column if not exists special boolean not null default false;

-- Arcade gains the four Trace Master modes. Pro mode only pays special students (and the tutor).
create or replace function arcade_finish(p_game text, p_score int, p_success boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare paid_today boolean; xp_gain int := 0; coin_gain int := 0; res jsonb;
begin
  if not is_approved() then raise exception 'not approved'; end if;
  if p_game not in ('ip-blaster-v4', 'ip-blaster-v6', 'cpu-commander', 'embedded-sorter',
                    'trace-o', 'trace-as', 'trace-a', 'trace-pro') then raise exception 'unknown game'; end if;
  if p_game = 'trace-pro' and not is_tutor()
     and not coalesce((select special from profiles where id = auth.uid()), false) then
    raise exception 'special training only';
  end if;
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
