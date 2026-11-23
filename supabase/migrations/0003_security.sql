-- Row level security, column privileges, storage buckets and realtime.

alter table profiles enable row level security;
alter table courses enable row level security;
alter table chapters enable row level security;
alter table parts enable row level security;
alter table resources enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table question_keys enable row level security;
alter table quiz_attempts enable row level security;
alter table xp_events enable row level security;
alter table achievements enable row level security;
alter table user_achievements enable row level security;
alter table challenges enable row level security;
alter table challenge_progress enable row level security;
alter table class_sessions enable row level security;
alter table attendance enable row level security;
alter table assignments enable row level security;
alter table submissions enable row level security;
alter table tutor_notes enable row level security;
alter table student_topics enable row level security;
alter table reports enable row level security;
alter table announcements enable row level security;
alter table notifications enable row level security;
alter table battles enable row level security;
alter table battle_players enable row level security;
alter table battle_rounds enable row level security;
alter table battle_answers enable row level security;

-- profiles: you see yourself; the tutor sees everyone. Other students' public cards come from profile_cards().
-- Explicit table access, so the app works whether or not "Grant API access to new tables
-- automatically" was ticked when the project was created. RLS below still decides which ROWS.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant select on all tables in schema public to authenticated;

create policy profiles_select on profiles for select using (id = auth.uid() or is_tutor());
create policy profiles_update_self on profiles for update using (id = auth.uid()) with check (id = auth.uid());
-- students may only change these columns themselves (everything else goes through the server)
revoke update on profiles from authenticated, anon;
grant update (display_name, theme, avatar_mode, blocky, contact) on profiles to authenticated;

-- content: drafts are invisible; locked/scheduled items show as locked; bodies only when live
create policy courses_select on courses for select using (is_approved() and (active or is_tutor()));
create policy chapters_select on chapters for select using (is_tutor() or (is_approved() and status <> 'draft'));
create policy parts_select on parts for select using (
  is_tutor() or (is_approved() and is_live(status, release_at)
    and exists (select 1 from chapters c where c.id = chapter_id and is_live(c.status, c.release_at))));
create policy resources_select on resources for select using (
  is_tutor() or (is_approved() and is_live(status, release_at)
    and (chapter_id is null or exists (select 1 from chapters c where c.id = chapter_id and is_live(c.status, c.release_at)))));
create policy quizzes_select on quizzes for select using (is_tutor() or (is_approved() and status <> 'draft'));
create policy questions_select on questions for select using (
  is_tutor() or (is_approved() and quiz_id is not null
    and exists (select 1 from quizzes z where z.id = quiz_id and is_live(z.status, z.release_at))));
create policy keys_tutor on question_keys for select using (is_tutor());

create policy attempts_select on quiz_attempts for select using (user_id = auth.uid() or is_tutor());
create policy xp_select on xp_events for select using (user_id = auth.uid() or is_tutor());
create policy ach_select on achievements for select using (is_approved());
create policy uach_select on user_achievements for select using (user_id = auth.uid() or is_tutor());
create policy ch_select on challenges for select using (is_approved() and (active or is_tutor()));
create policy chp_select on challenge_progress for select using (user_id = auth.uid() or is_tutor());

create policy sessions_select on class_sessions for select using (is_approved());
create policy att_select on attendance for select using (user_id = auth.uid() or is_tutor());
create policy asg_select on assignments for select using (is_tutor() or (is_approved() and is_live(status, release_at)));
create policy sub_select on submissions for select using (user_id = auth.uid() or is_tutor());

create policy notes_tutor on tutor_notes for select using (is_tutor());
create policy topics_select on student_topics for select using (student_id = auth.uid() or is_tutor());
create policy reports_select on reports for select using (is_tutor() or (student_id = auth.uid() and shared_with_student));
create policy ann_select on announcements for select using (is_approved());

create policy notif_select on notifications for select using (user_id = auth.uid());
create policy notif_update on notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on notifications from authenticated, anon;
grant update (read_at) on notifications to authenticated;

-- battles: lobbies are visible to approved players; rounds/answers only to participants;
-- an answer stays hidden from others until its round is revealed
create policy battles_select on battles for select using (is_approved());
create policy bp_select on battle_players for select using (is_approved());
create policy br_select on battle_rounds for select using (
  exists (select 1 from battle_players p where p.battle_id = battle_rounds.battle_id and p.user_id = auth.uid()) or is_tutor());
create policy ba_select on battle_answers for select using (
  (user_id = auth.uid() or revealed or is_tutor())
  and exists (select 1 from battle_players p where p.battle_id = battle_answers.battle_id and p.user_id = auth.uid()));

-- No insert/update/delete policies exist for students on any other table:
-- every write goes through SECURITY DEFINER functions or the server (service role).

-- ---------------------------------------------------------------- storage (private buckets; files are served with signed URLs from the server)
insert into storage.buckets (id, name, public) values
  ('resources', 'resources', false),
  ('submissions', 'submissions', false),
  ('solutions', 'solutions', false)
on conflict (id) do nothing;
-- 25 MB per file; uploads go straight from the browser to storage with one-time signed upload URLs
update storage.buckets set file_size_limit = 26214400 where id in ('resources','submissions','solutions');

-- ---------------------------------------------------------------- realtime
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table battles, battle_players, battle_answers, battle_rounds, notifications;
  end if;
exception when duplicate_object then null; end $$;
