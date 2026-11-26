-- Battle fairness fix (26 Nov 2026). Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Hole: start_battle creates all rounds up front, and a participant could read every upcoming
-- round's question_id via the raw API, then pre-read the questions before each timer started.
-- (The answer key was never exposed — question_keys is tutor-only — but seeing the questions early
-- is still a decisive edge in a timed battle.) Fix: participants see only the current and past rounds.
drop policy if exists br_select on battle_rounds;
create policy br_select on battle_rounds for select using (
  is_tutor() or (
    exists (select 1 from battle_players p where p.battle_id = battle_rounds.battle_id and p.user_id = auth.uid())
    and round_no <= coalesce((select current_round from battles b where b.id = battle_rounds.battle_id), 0)
  ));
