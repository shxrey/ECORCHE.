-- =====================================================================
-- Blueprint PPL — initial schema
--
-- The program itself (exercises, cues, MVIC %, citations) lives in the
-- codebase (src/content/program.ts). The database stores only what each
-- lifter creates: profile, preferences, logged sets, notes, live timers.
--
-- Security model: every table has row-level security, and every policy is
-- "you can only touch rows where user_id is you". The public anon key in
-- the browser can therefore never read or write another lifter's data.
--
-- Run once in Supabase: Dashboard → SQL Editor → paste → Run.
-- =====================================================================

-- ---------- helpers ----------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Exercise keys are permanent IDs from program.ts: push-a1 … legs-b7.
create domain public.exercise_key as text
  check (value ~ '^(push|pull|legs)-[ab][1-9][0-9]?$');

create domain public.day_id as text
  check (value in ('pushA', 'pushB', 'pullA', 'pullB', 'legsA', 'legsB'));

-- ---------- profiles ----------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  username      text unique
                check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name  text check (char_length(display_name) between 1 and 40),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is 'One row per lifter, created automatically at sign-up.';

-- ---------- user_settings ----------
-- Mirrors the old per-device localStorage preferences so they follow the
-- lifter across devices.

create table public.user_settings (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  auto_rest            boolean  not null default true,
  voice_announcements  boolean  not null default true,
  high_contrast        boolean  not null default false,
  mesocycle_week       smallint not null default 1 check (mesocycle_week between 1 and 6),
  -- Start of the current tracking cycle: the weekly tracker counts sets
  -- completed on or after this date ("Reset all" moves it forward).
  cycle_started_on     date,
  updated_at           timestamptz not null default now()
);

-- ---------- set_logs ----------
-- One row per (exercise, calendar day, set). Replaces both the old doneMap
-- (completed) and logMap (weight / reps / RIR).
--
-- log_date is the lifter's LOCAL calendar date (YYYY-MM-DD), sent by the
-- client exactly as the original app computed it — never derived from UTC
-- on the server, so a late-night set never lands on the wrong day.

create table public.set_logs (
  id                 bigint generated always as identity primary key,
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_key       public.exercise_key not null,
  log_date           date     not null,
  set_idx            smallint not null check (set_idx between 1 and 12),
  completed          boolean  not null default false,
  weight             numeric(6, 2) check (weight >= 0 and weight < 1000),
  reps               smallint check (reps between 0 and 200),
  rir                smallint check (rir between 0 and 10),
  -- When the lifter made the change on their device. Offline edits that
  -- sync late use this for last-write-wins instead of arrival time.
  client_updated_at  timestamptz not null default now(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- Makes every save an idempotent upsert: a retried request after a
  -- dropped gym connection updates the same row instead of duplicating it.
  unique (user_id, exercise_key, log_date, set_idx)
);

create index set_logs_user_date_idx on public.set_logs (user_id, log_date desc);

-- ---------- exercise_notes ----------

create table public.exercise_notes (
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_key  public.exercise_key not null,
  note_date     date not null,
  body          text not null check (char_length(body) <= 2000),
  client_updated_at timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  primary key (user_id, exercise_key, note_date)
);

-- ---------- active_sessions ----------
-- The running session timer per training day, so starting a workout on the
-- phone shows the same elapsed time on the laptop.

create table public.active_sessions (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day_id      public.day_id not null,
  started_at  timestamptz not null,
  primary key (user_id, day_id)
);

-- ---------- updated_at triggers ----------

create trigger profiles_updated_at       before update on public.profiles       for each row execute function public.set_updated_at();
create trigger user_settings_updated_at  before update on public.user_settings  for each row execute function public.set_updated_at();
create trigger set_logs_updated_at       before update on public.set_logs       for each row execute function public.set_updated_at();
create trigger exercise_notes_updated_at before update on public.exercise_notes for each row execute function public.set_updated_at();

-- ---------- sign-up hook ----------
-- Every new auth user gets a profile and default settings, atomically.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row-level security ----------
-- (select auth.uid()) instead of auth.uid() lets Postgres evaluate it once
-- per query instead of once per row.

alter table public.profiles        enable row level security;
alter table public.user_settings   enable row level security;
alter table public.set_logs        enable row level security;
alter table public.exercise_notes  enable row level security;
alter table public.active_sessions enable row level security;

-- profiles: read and edit your own. Rows are created by the sign-up hook
-- and removed by the auth.users cascade, so no insert/delete policy.
create policy "profiles: read own"   on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- user_settings: same shape as profiles.
create policy "settings: read own"   on public.user_settings for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "settings: update own" on public.user_settings for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- set_logs, exercise_notes, active_sessions: full control over your own rows only.
create policy "set_logs: own rows" on public.set_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes: own rows" on public.exercise_notes for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "sessions: own rows" on public.active_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Anonymous visitors get nothing (RLS already denies them; this removes
-- the table privileges too, as defense in depth).
revoke all on public.profiles, public.user_settings, public.set_logs,
              public.exercise_notes, public.active_sessions from anon;
