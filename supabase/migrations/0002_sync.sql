-- =====================================================================
-- Blueprint PPL: cloud sync (Step 3)
--
-- Matches the database to how the app actually stores progress:
--   • Ticked set dots are NOT dated. They are "this week's checklist",
--     cleared by Reset. They get their own table, set_checks.
--   • Weight / reps / RIR logs ARE dated (set_logs), and carry the
--     persistent PR marker.
--   • Daily set counts feed the history sparkline (daily_set_counts).
--
-- Sync model: every synced row carries client_updated_at, the moment the
-- lifter made the change on their device. Writes go through sync_push(),
-- which only overwrites a row with a NEWER change (last-write-wins per
-- row), so a phone that was offline all week can never clobber what the
-- laptop did since. Removals are kept as "tombstones" (checked = false,
-- empty values, sets = 0) so other devices learn about them too.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
-- =====================================================================

-- ---------- set_logs: fit the app's real ranges ----------
-- `completed` moves to set_checks: a tick isn't tied to a log date.
alter table public.set_logs drop column completed;
alter table public.set_logs add column is_pr boolean not null default false;
-- The app accepts up to 2000 kg (sled / leg press) and RIR up to 20.
alter table public.set_logs drop constraint set_logs_weight_check;
alter table public.set_logs add constraint set_logs_weight_check check (weight >= 0 and weight <= 2000);
alter table public.set_logs drop constraint set_logs_rir_check;
alter table public.set_logs add constraint set_logs_rir_check check (rir between 0 and 20);
create index set_logs_user_updated_idx on public.set_logs (user_id, updated_at);

create index exercise_notes_user_updated_idx on public.exercise_notes (user_id, updated_at);

-- ---------- set_checks: the weekly checklist ----------
create table public.set_checks (
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_key       public.exercise_key not null,
  set_idx            smallint not null check (set_idx between 1 and 12),
  checked            boolean  not null,
  client_updated_at  timestamptz not null,
  updated_at         timestamptz not null default now(),
  primary key (user_id, exercise_key, set_idx)
);
create index set_checks_user_updated_idx on public.set_checks (user_id, updated_at);

-- ---------- daily_set_counts: the history sparkline ----------
create table public.daily_set_counts (
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day                date not null,
  sets               integer not null check (sets between 0 and 2000),
  client_updated_at  timestamptz not null,
  updated_at         timestamptz not null default now(),
  primary key (user_id, day)
);
create index daily_set_counts_user_updated_idx on public.daily_set_counts (user_id, updated_at);

-- ---------- user_settings: last-write-wins too ----------
alter table public.user_settings add column client_updated_at timestamptz not null default 'epoch';

create trigger set_checks_updated_at       before update on public.set_checks       for each row execute function public.set_updated_at();
create trigger daily_set_counts_updated_at before update on public.daily_set_counts for each row execute function public.set_updated_at();

-- ---------- row-level security ----------
alter table public.set_checks       enable row level security;
alter table public.daily_set_counts enable row level security;

create policy "set_checks: own rows" on public.set_checks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "daily_set_counts: own rows" on public.daily_set_counts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.set_checks, public.daily_set_counts from anon;
grant select, insert, update, delete on public.set_checks       to authenticated;
grant select, insert, update, delete on public.daily_set_counts to authenticated;

-- ---------- sync_push: one round trip, newest change wins ----------
-- Runs as the caller (security invoker), so every row still passes RLS.
-- user_id always comes from the session, never from the payload.
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

  if p ? 'settings' and jsonb_typeof(p -> 'settings') = 'object' then
    update public.user_settings s
       set auto_rest           = coalesce((p -> 'settings' ->> 'auto_rest')::boolean, s.auto_rest),
           voice_announcements = coalesce((p -> 'settings' ->> 'voice_announcements')::boolean, s.voice_announcements),
           high_contrast       = coalesce((p -> 'settings' ->> 'high_contrast')::boolean, s.high_contrast),
           mesocycle_week      = coalesce((p -> 'settings' ->> 'mesocycle_week')::smallint, s.mesocycle_week),
           client_updated_at   = (p -> 'settings' ->> 'ts')::timestamptz
     where s.user_id = uid
       and s.client_updated_at <= (p -> 'settings' ->> 'ts')::timestamptz;
  end if;
end;
$$;

-- ---------- sync_pull: everything changed since the last pull ----------
-- `since` is the server_time a previous pull returned (the client
-- subtracts a small overlap); null means "everything".
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
    'settings', (
      select jsonb_build_object('auto_rest', auto_rest, 'voice_announcements', voice_announcements,
                                'high_contrast', high_contrast, 'mesocycle_week', mesocycle_week,
                                'ts', client_updated_at)
      from public.user_settings
      where user_id = (select auth.uid()) and (since is null or updated_at > since))
  );
$$;

revoke execute on function public.sync_push(jsonb), public.sync_pull(timestamptz) from public, anon;
grant execute on function public.sync_push(jsonb), public.sync_pull(timestamptz) to authenticated;
