-- =====================================================================
-- ÉCORCHÉ: sync the workout timer (2026-11-24)
--
-- The session timer (the clock in the bar at the top, which starts with a
-- day's first ticked set) now follows the lifter between devices like
-- everything else. It uses active_sessions, which 0001 created but nothing
-- used until now.
--
--   • active_sessions joins last-write-wins sync: client_updated_at (when
--     the device made the change) and updated_at (when the server stored
--     it, for "what changed since my last pull").
--   • started_at may now be null, meaning "this day's timer was reset" (a
--     tombstone), so a reset on one device clears the timer on the others.
--   • sync_push / sync_pull are the 0004 versions plus a "timers" list.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
-- =====================================================================

alter table public.active_sessions alter column started_at drop not null;
alter table public.active_sessions add column client_updated_at timestamptz not null default 'epoch';
alter table public.active_sessions add column updated_at timestamptz not null default now();
create index active_sessions_user_updated_idx on public.active_sessions (user_id, updated_at);
create trigger active_sessions_updated_at before update on public.active_sessions
  for each row execute function public.set_updated_at();

-- ---------- sync_push: as in 0004, plus timers ----------
create or replace function public.sync_push(p jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  insert into public.set_checks as t (user_id, exercise_key, set_idx, checked, client_updated_at)
  select uid, r.exercise_key, r.set_idx, r.checked, r.ts
  from jsonb_to_recordset(coalesce(p -> 'checks', '[]')) as r(exercise_key text, set_idx smallint, checked boolean, ts timestamptz)
  on conflict (user_id, exercise_key, set_idx) do update
    set checked = excluded.checked, client_updated_at = excluded.client_updated_at
    where t.client_updated_at <= excluded.client_updated_at;

  insert into public.set_logs as t (user_id, exercise_key, log_date, set_idx, weight, reps, rir, is_pr, client_updated_at)
  select uid, r.exercise_key, r.log_date, r.set_idx, r.weight, r.reps, r.rir, coalesce(r.is_pr, false), r.ts
  from jsonb_to_recordset(coalesce(p -> 'logs', '[]'))
    as r(exercise_key text, log_date date, set_idx smallint, weight numeric, reps smallint, rir smallint, is_pr boolean, ts timestamptz)
  on conflict (user_id, exercise_key, log_date, set_idx) do update
    set weight = excluded.weight, reps = excluded.reps, rir = excluded.rir,
        is_pr = excluded.is_pr, client_updated_at = excluded.client_updated_at
    where t.client_updated_at <= excluded.client_updated_at;

  insert into public.exercise_notes as t (user_id, exercise_key, note_date, body, client_updated_at)
  select uid, r.exercise_key, r.note_date, r.body, r.ts
  from jsonb_to_recordset(coalesce(p -> 'notes', '[]')) as r(exercise_key text, note_date date, body text, ts timestamptz)
  on conflict (user_id, exercise_key, note_date) do update
    set body = excluded.body, client_updated_at = excluded.client_updated_at
    where t.client_updated_at <= excluded.client_updated_at;

  insert into public.daily_set_counts as t (user_id, day, sets, client_updated_at)
  select uid, r.day, r.sets, r.ts
  from jsonb_to_recordset(coalesce(p -> 'days', '[]')) as r(day date, sets integer, ts timestamptz)
  on conflict (user_id, day) do update
    set sets = excluded.sets, client_updated_at = excluded.client_updated_at
    where t.client_updated_at <= excluded.client_updated_at;

  insert into public.active_sessions as t (user_id, day_id, started_at, client_updated_at)
  select uid, r.day_id, r.started_at, r.ts
  from jsonb_to_recordset(coalesce(p -> 'timers', '[]')) as r(day_id text, started_at timestamptz, ts timestamptz)
  on conflict (user_id, day_id) do update
    set started_at = excluded.started_at, client_updated_at = excluded.client_updated_at
    where t.client_updated_at <= excluded.client_updated_at;

  if p ? 'settings' and jsonb_typeof(p -> 'settings') = 'object' then
    update public.user_settings s
       set auto_rest           = coalesce((p -> 'settings' ->> 'auto_rest')::boolean, s.auto_rest),
           voice_announcements = coalesce((p -> 'settings' ->> 'voice_announcements')::boolean, s.voice_announcements),
           high_contrast       = coalesce((p -> 'settings' ->> 'high_contrast')::boolean, s.high_contrast),
           mesocycle_week      = coalesce((p -> 'settings' ->> 'mesocycle_week')::smallint, s.mesocycle_week),
           weight_unit         = coalesce(p -> 'settings' ->> 'weight_unit', s.weight_unit),
           client_updated_at   = (p -> 'settings' ->> 'ts')::timestamptz
     where s.user_id = uid
       and s.client_updated_at <= (p -> 'settings' ->> 'ts')::timestamptz;
  end if;
end;
$$;

-- ---------- sync_pull: as in 0004, plus timers ----------
create or replace function public.sync_pull(since timestamptz default null)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'server_time', now(),
    'checks', coalesce((
      select jsonb_agg(jsonb_build_object('exercise_key', exercise_key, 'set_idx', set_idx,
                                          'checked', checked, 'ts', client_updated_at))
      from public.set_checks
      where user_id = (select auth.uid()) and (since is null or updated_at > since)), '[]'::jsonb),
    'logs', coalesce((
      select jsonb_agg(jsonb_build_object('exercise_key', exercise_key, 'log_date', log_date, 'set_idx', set_idx,
                                          'weight', weight, 'reps', reps, 'rir', rir, 'is_pr', is_pr,
                                          'ts', client_updated_at))
      from public.set_logs
      where user_id = (select auth.uid()) and (since is null or updated_at > since)), '[]'::jsonb),
    'notes', coalesce((
      select jsonb_agg(jsonb_build_object('exercise_key', exercise_key, 'note_date', note_date,
                                          'body', body, 'ts', client_updated_at))
      from public.exercise_notes
      where user_id = (select auth.uid()) and (since is null or updated_at > since)), '[]'::jsonb),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'sets', sets, 'ts', client_updated_at))
      from public.daily_set_counts
      where user_id = (select auth.uid()) and (since is null or updated_at > since)), '[]'::jsonb),
    'timers', coalesce((
      select jsonb_agg(jsonb_build_object('day_id', day_id, 'started_at', started_at, 'ts', client_updated_at))
      from public.active_sessions
      where user_id = (select auth.uid()) and (since is null or updated_at > since)), '[]'::jsonb),
    'settings', (
      select jsonb_build_object('auto_rest', auto_rest, 'voice_announcements', voice_announcements,
                                'high_contrast', high_contrast, 'mesocycle_week', mesocycle_week,
                                'weight_unit', weight_unit, 'ts', client_updated_at)
      from public.user_settings
      where user_id = (select auth.uid()) and (since is null or updated_at > since))
  );
$$;

-- Replacing a function keeps its permissions; restated here so this file stands on its own.
revoke execute on function public.sync_push(jsonb), public.sync_pull(timestamptz) from public, anon;
grant execute on function public.sync_push(jsonb), public.sync_pull(timestamptz) to authenticated;
