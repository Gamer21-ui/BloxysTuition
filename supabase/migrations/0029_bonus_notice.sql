-- Tutor bonus notifications: the title shows coins too, and the tutor's message is the body (students tap to read it).
create or replace function tutor_award(p_user uuid, p_xp int, p_coins int, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not is_tutor() then raise exception 'tutor only'; end if;
  r := award_xp(p_user, p_xp, 'bonus', p_reason, null, p_coins, false);
  perform notify(p_user,
    'Bonus from your tutor: ' || concat_ws(' and ',
      case when coalesce(p_xp, 0) <> 0 then '+' || p_xp || ' XP' end,
      case when coalesce(p_coins, 0) <> 0 then '+' || p_coins || ' coins' end),
    coalesce(nullif(btrim(p_reason), ''), 'Keep it up!'), '/notifications');
  perform check_achievements(p_user);
  return r;
end $$;
