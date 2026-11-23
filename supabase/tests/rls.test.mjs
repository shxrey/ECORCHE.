// Security + sync test for the database. Applies every migration in
// supabase/migrations to an in-memory Postgres (PGlite) with a minimal stand-in
// for Supabase's auth schema, exactly the way production gets them (0001 with
// data already in it, then 0002), and proves:
//   • constraints and row-level security isolate every lifter
//   • sync_push / sync_pull are last-write-wins and can't be abused
//   npm run test:db
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

const db = new PGlite();
const migration = name => readFileSync(new URL(`../migrations/${name}`, import.meta.url), 'utf8');

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema public, auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
// No extra grants here: like a Supabase project with "Grant API access to new
// tables automatically" turned off, every permission must come from the migrations.
await db.exec(migration('0001_init.sql'));

const A = '11111111-1111-1111-1111-111111111111';
const B = '22222222-2222-2222-2222-222222222222';
await db.exec(`insert into auth.users values ('${A}','a@x'), ('${B}','b@x');`);
// A row that already exists in production before 0002 runs.
await db.exec(`insert into public.set_logs (user_id, exercise_key, log_date, set_idx, completed, weight)
               values ('${B}','legs-a1','2026-11-01',1,true,100)`);
await db.exec(migration('0002_sync.sql'));
await db.exec(migration('0003_delete_account.sql'));
console.log('✓ migrations applied (0002 on top of existing data, then 0003)');

const counts = await db.query(`select (select count(*) from public.profiles) p, (select count(*) from public.user_settings) s`);
console.log('✓ signup trigger created rows:', counts.rows[0]);

let failures = 0;
const check = (ok, msg) => { console.log((ok ? '✓ ' : '✗ ') + msg); if (!ok) failures++; };
async function as(uid, sql, params) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
  try { return await db.query(sql, params); } finally { await db.exec('reset role;'); }
}
async function fails(uid, sql, params) { try { await as(uid, sql, params); return false; } catch { return true; } }
const push = (uid, payload) => as(uid, `select public.sync_push($1::jsonb)`, [JSON.stringify(payload)]);
const pull = async (uid, since = null) => (await as(uid, `select public.sync_pull($1::timestamptz) as r`, [since])).rows[0].r;

// ---------- row-level security ----------
await as(A, `insert into public.set_logs (exercise_key, log_date, set_idx, weight, reps, rir) values ('push-a1','2026-11-21',1,60,10,1)`);
await as(A, `insert into public.set_logs (exercise_key, log_date, set_idx, weight, reps, rir) values ('push-a1','2026-11-21',1,62.5,9,0)
             on conflict (user_id, exercise_key, log_date, set_idx) do update set weight = excluded.weight, reps = excluded.reps, rir = excluded.rir`);
const a = await as(A, `select weight, reps, user_id from public.set_logs`);
check(a.rows.length === 1 && Number(a.rows[0].weight) === 62.5 && a.rows[0].user_id === A, 'upsert is idempotent and user_id defaults to the signed-in user');

check((await as(B, `select * from public.set_logs where user_id = '${A}'`)).rows.length === 0, "user B cannot see user A's sets");
await as(B, `update public.set_logs set weight = 1`);
check(Number((await as(A, `select weight from public.set_logs`)).rows[0].weight) === 62.5, "user B cannot edit user A's sets");
await as(B, `delete from public.set_logs`);
check((await as(A, `select * from public.set_logs`)).rows.length === 1, "user B cannot delete user A's sets");
check(await fails(B, `insert into public.set_logs (user_id, exercise_key, log_date, set_idx) values ('${A}','push-a1','2026-11-22',1)`), 'user B cannot insert rows as user A');
check(await fails(null, `select * from public.set_logs`), 'anonymous visitors cannot read set_logs');
check(await fails(null, `select * from public.set_checks`), 'anonymous visitors cannot read set_checks');
check((await as(B, `select * from public.profiles`)).rows.length === 1, 'each user sees only their own profile');

// ---------- constraints ----------
check(await fails(A, `insert into public.set_logs (exercise_key, log_date, set_idx) values ('squat','2026-11-21',1)`), 'rejects an invalid exercise key');
check(await fails(A, `insert into public.set_logs (exercise_key, log_date, set_idx, rir) values ('push-a1','2026-11-21',2, 21)`), 'rejects RIR above 20');
check(!(await fails(A, `insert into public.set_logs (exercise_key, log_date, set_idx, weight, rir) values ('legs-a2','2026-11-21',1, 1500, 15)`)), 'accepts the app\'s full ranges (1500 kg, RIR 15)');
check(await fails(A, `insert into public.active_sessions (day_id, started_at) values ('armsA', now())`), 'rejects an unknown day id');
check(await fails(A, `update public.user_settings set mesocycle_week = 7`), 'rejects mesocycle week 7');
await as(A, `update public.profiles set username = 'shrey_lifts'`);
check(await fails(B, `update public.profiles set username = 'shrey_lifts'`), 'usernames are unique');
check(await fails(B, `update public.profiles set username = 'Bad Name!'`), 'rejects badly formatted usernames');

// ---------- sync ----------
const T1 = '2026-11-23T10:00:00Z', T2 = '2026-11-23T11:00:00Z', T0 = '2026-11-23T09:00:00Z';
await push(A, {
  checks: [{ exercise_key: 'push-a1', set_idx: 1, checked: true, ts: T1 }],
  logs: [{ exercise_key: 'push-a1', log_date: '2026-11-23', set_idx: 1, weight: 80, reps: 8, rir: 1, is_pr: true, ts: T1 }],
  notes: [{ exercise_key: 'push-a1', note_date: '2026-11-23', body: 'elbows in', ts: T1 }],
  days: [{ day: '2026-11-23', sets: 1, ts: T1 }],
  settings: { auto_rest: false, voice_announcements: true, high_contrast: true, mesocycle_week: 3, ts: T1 },
});
let r = await pull(A);
check(r.checks.length === 1 && r.checks[0].checked === true, 'sync_push stores a tick, sync_pull returns it');
check(r.logs.some(l => l.log_date === '2026-11-23' && Number(l.weight) === 80 && l.is_pr === true), 'logs round-trip with the PR marker');
check(r.notes[0]?.body === 'elbows in' && r.days[0]?.sets === 1, 'notes and daily counts round-trip');
check(r.settings.mesocycle_week === 3 && r.settings.high_contrast === true && r.settings.auto_rest === false, 'settings round-trip');

// An offline phone pushes an OLDER change later: it must not win.
await push(A, {
  checks: [{ exercise_key: 'push-a1', set_idx: 1, checked: false, ts: T0 }],
  logs: [{ exercise_key: 'push-a1', log_date: '2026-11-23', set_idx: 1, weight: 70, reps: 8, rir: 1, ts: T0 }],
  settings: { mesocycle_week: 1, ts: T0 },
});
r = await pull(A);
check(r.checks[0].checked === true && r.logs.some(l => Number(l.weight) === 80) && r.settings.mesocycle_week === 3, 'an older offline change never overwrites a newer one');

// A newer change wins, including a removal (tombstone).
await push(A, { checks: [{ exercise_key: 'push-a1', set_idx: 1, checked: false, ts: T2 }], settings: { mesocycle_week: 4, ts: T2 } });
r = await pull(A);
check(r.checks[0].checked === false && r.settings.mesocycle_week === 4, 'a newer change (even an untick) wins');

// Incremental pulls only return what changed.
const cursor = r.server_time;
await db.exec(`select pg_sleep(0.01)`);
await push(A, { days: [{ day: '2026-11-24', sets: 5, ts: T2 }] });
r = await pull(A, cursor);
check(r.days.length === 1 && r.days[0].day === '2026-11-24' && r.checks.length === 0 && r.settings === null, 'sync_pull(since) returns only newer rows');

// Isolation and abuse.
check((await pull(B)).checks.length === 0 && (await pull(B)).logs.every(l => l.exercise_key === 'legs-a1'), "sync_pull never returns another lifter's rows");
await push(B, { checks: [{ exercise_key: 'push-a1', set_idx: 1, checked: true, ts: '2030-01-01T00:00:00Z' }] });
check((await pull(A)).checks[0].checked === false, "user B's push can't touch user A's rows (user_id comes from the session)");
check(await fails(null, `select public.sync_push('{}'::jsonb)`), 'anonymous visitors cannot call sync_push');
check(await fails(null, `select public.sync_pull(null)`), 'anonymous visitors cannot call sync_pull');
check(await fails(A, `select public.sync_push($1::jsonb)`, [JSON.stringify({ checks: [{ exercise_key: 'squat', set_idx: 1, checked: true, ts: T2 }] })]), 'sync_push still enforces constraints');

// ---------- account deletion (delete_my_account, 0003) ----------
check(await fails(null, `select public.delete_my_account()`), 'anonymous visitors cannot call delete_my_account');
await push(B, {
  checks: [{ exercise_key: 'legs-a1', set_idx: 1, checked: true, ts: T1 }],
  logs: [{ exercise_key: 'legs-a1', log_date: '2026-11-23', set_idx: 1, weight: 120, reps: 6, rir: 2, is_pr: false, ts: T1 }],
});
const bBefore = await db.query(`select (select count(*) from public.set_logs where user_id = '${B}') s,
                                       (select count(*) from public.set_checks where user_id = '${B}') c`);
check(Number(bBefore.rows[0].s) > 0 && Number(bBefore.rows[0].c) > 0, 'user B has data before user A deletes their account');

await as(A, `select public.delete_my_account()`);
const left = await db.query(`select (select count(*) from auth.users where id = '${A}') u,
                                    (select count(*) from public.set_logs where user_id = '${A}') s,
                                    (select count(*) from public.set_checks where user_id = '${A}') c,
                                    (select count(*) from public.daily_set_counts where user_id = '${A}') d,
                                    (select count(*) from public.profiles where id = '${A}') p,
                                    (select count(*) from public.user_settings where user_id = '${A}') st`);
const l = Object.fromEntries(Object.entries(left.rows[0]).map(([k, v]) => [k, Number(v)]));
check(l.u + l.s + l.c + l.d + l.p + l.st === 0, "delete_my_account removes the caller's account and all of their data");

const bAfter = await db.query(`select (select count(*) from auth.users where id = '${B}') u,
                                      (select count(*) from public.set_logs where user_id = '${B}') s,
                                      (select count(*) from public.set_checks where user_id = '${B}') c`);
check(Number(bAfter.rows[0].u) === 1 && bAfter.rows[0].s === bBefore.rows[0].s && bAfter.rows[0].c === bBefore.rows[0].c,
  "deleting user A never touches user B's account or data");
check(await fails(B, `select * from auth.users`), 'signed-in users still cannot read auth.users directly');

console.log(failures ? `\n${failures} FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
