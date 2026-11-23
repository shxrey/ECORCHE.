-- =====================================================================
-- ÉCORCHÉ: "Delete my account" (2026-11-24)
--
-- Lets a signed-in lifter permanently delete their own account. Deleting
-- the auth.users row removes everything else through the existing
-- "on delete cascade" foreign keys: profile, settings, set logs, ticks,
-- notes, daily counts, sessions, and Supabase's own sign-in sessions.
--
-- Safety:
--   • It can only ever delete the CALLER: the id comes from the session
--     (auth.uid()), never from an argument.
--   • Only signed-in users can run it; anonymous visitors can't.
--   • It runs with the function owner's rights (security definer) because
--     ordinary users have no access to auth.users; the fixed, empty
--     search_path stops anyone from swapping in look-alike tables.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
-- =====================================================================

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = me;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
