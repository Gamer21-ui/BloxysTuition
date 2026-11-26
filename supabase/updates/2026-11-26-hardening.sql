-- Security hardening (26 Nov 2026). Paste into Supabase > SQL Editor > Run. Safe to run more than once.
-- Closes the one real gap a security review found: a student could set display_name to anything
-- (huge or offensive) by calling the raw API directly, skipping the 2-32 char check the website does.
-- A database CHECK adds a hard 40-char cap no matter how the write arrives. NOT VALID = existing names are left alone.
do $$ begin
  alter table profiles drop constraint if exists display_name_len;
  alter table profiles add constraint display_name_len
    check (char_length(display_name) between 1 and 40) not valid;
exception when others then null; end $$;

-- Keep the blocky-avatar JSON small, so nobody can stuff megabytes into their profile via the raw API.
do $$ begin
  alter table profiles drop constraint if exists blocky_small;
  alter table profiles add constraint blocky_small
    check (blocky is null or pg_column_size(blocky) < 2000) not valid;
exception when others then null; end $$;
