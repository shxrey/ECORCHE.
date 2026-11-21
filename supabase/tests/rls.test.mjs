// Security test for the database: applies supabase/migrations/0001_init.sql to an
// in-memory Postgres (PGlite) with a minimal stand-in for Supabase's auth schema,
// then proves constraints and row-level security isolate every lifter.
//   npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
const migration = readFileSync(new URL('../migrations/0001_init.sql', import.meta.url), 'utf8');

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
await db.exec(migration);
// No extra grants here: like a Supabase project with "Grant API access to new
// tables automatically" turned off, every permission must come from the migration.
console.log('✓ migration applied');

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users values ('${A}','a@x'), ('${B}','b@x');`);
const counts = await db.query(`select (select count(*) from public.profiles) p, (select count(*) from public.user_settings) s`);
console.log('✓ signup trigger created rows:', counts.rows[0]);

let failures = 0;
const check = (ok, msg) => { console.log((ok ? '✓ ' : '✗ ') + msg); if (!ok) failures++; };
async function as(uid, sql) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
  try { return await db.query(sql); } finally { await db.exec('reset role;'); }
}
async function fails(uid, sql) { try { await as(uid, sql); return false; } catch { return true; } }

await as(A, `insert into public.set_logs (exercise_key, log_date, set_idx, completed, weight, reps, rir) values ('push-a1','2026-11-21',1,true,60,10,1)`);
await as(A, `insert into public.set_logs (exercise_key, log_date, set_idx, completed, weight, reps, rir) values ('push-a1','2026-11-21',1,true,62.5,9,0)
             on conflict (user_id, exercise_key, log_date, set_idx) do update set weight = excluded.weight, reps = excluded.reps, rir = excluded.rir`);
const a = await as(A, `select weight, reps, user_id from public.set_logs`);
check(a.rows.length === 1 && Number(a.rows[0].weight) === 62.5 && a.rows[0].user_id === A, 'upsert is idempotent and user_id defaults to the signed-in user');

check((await as(B, `select * from public.set_logs`)).rows.length === 0, "user B cannot see user A's sets");
await as(B, `update public.set_logs set weight = 1`);
check(Number((await as(A, `select weight from public.set_logs`)).rows[0].weight) === 62.5, "user B cannot edit user A's sets");
await as(B, `delete from public.set_logs`);
check((await as(A, `select * from public.set_logs`)).rows.length === 1, "user B cannot delete user A's sets");
check(await fails(B, `insert into public.set_logs (user_id, exercise_key, log_date, set_idx) values ('${A}','push-a1','2026-11-22',1)`), 'user B cannot insert rows as user A');
check(await fails(null, `select * from public.set_logs`), 'anonymous visitors cannot read set_logs');
check((await as(B, `select * from public.profiles`)).rows.length === 1, 'each user sees only their own profile');

check(await fails(A, `insert into public.set_logs (exercise_key, log_date, set_idx) values ('squat','2026-11-21',1)`), 'rejects an invalid exercise key');
check(await fails(A, `insert into public.set_logs (exercise_key, log_date, set_idx, rir) values ('push-a1','2026-11-21',2, 11)`), 'rejects RIR above 10');
check(await fails(A, `insert into public.active_sessions (day_id, started_at) values ('armsA', now())`), 'rejects an unknown day id');
check(await fails(A, `update public.user_settings set mesocycle_week = 7`), 'rejects mesocycle week 7');
await as(A, `update public.profiles set username = 'shrey_lifts'`);
check(await fails(B, `update public.profiles set username = 'shrey_lifts'`), 'usernames are unique');
check(await fails(B, `update public.profiles set username = 'Bad Name!'`), 'rejects badly formatted usernames');

await db.exec(`delete from auth.users where id = '${A}'`);
const left = await db.query(`select (select count(*) from public.set_logs) s, (select count(*) from public.profiles) p`);
check(Number(left.rows[0].s) === 0 && Number(left.rows[0].p) === 1, "deleting an account removes all of that user's data");

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
