# ÉCORCHÉ

A science-backed 6-day Push / Pull / Legs (A/B) hypertrophy protocol: 46 exercises, 132 weekly working sets, with set tracking, weight/rep/RIR logging, PR detection, a voice-announced rest timer and a distraction-free Workout Mode.

**Live:** https://ecorche.app

**Stack:** Next.js (App Router, TypeScript) · Supabase (Postgres, Auth, row-level security) · Resend (sign-in email) · Vercel

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
npm run test:db    # schema, row-level security + sync functions (in-memory Postgres)
npm run test:sync  # sync engine: simulated phone + laptop against a last-write-wins server
```

Without Supabase settings the app runs local-only, exactly like the original. To enable accounts, create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Both values are public by design. Security comes from row-level security in Postgres, not from hiding the key. Never put the `secret` / `service_role` key in this app.

## Accounts & database

- **Sign-in:** passwordless email code (`/login`). A code works on phones even when an emailed link would open in a different browser. The email carries only the code, in the subject and at the top, so mail apps can offer to copy it; pasting a whole code (or accepting the keyboard's code suggestion) signs in at once. Sign-up and sign-in are the same flow.
- **Schema:** [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql): `profiles`, `user_settings`, `set_logs`, `exercise_notes`, `active_sessions`. Every table is locked to `auth.uid() = user_id`.
- **Proof:** `npm run test:db` applies the migration to PGlite and checks that one lifter can never read, edit, delete or forge another's rows, plus all the data constraints.
- **Cloud sync** ([`src/lib/sync`](src/lib/sync)): offline-first. The app always works on its own local copy; the sync engine diffs it into small records (a tick, one set's log, a note, a day's count, settings), queues changes in an outbox that survives offline use and closed tabs, and syncs through two Postgres functions, `sync_push` / `sync_pull` ([`0002_sync.sql`](supabase/migrations/0002_sync.sql)). Conflicts are last-write-wins per record, enforced on the server, so a phone that was offline all week can't overwrite newer edits from the laptop. Removals sync as tombstones. On a device's first sign-in, its existing progress (including anything restored from an old JSON backup) uploads without overriding the account.
- **Email template:** [`supabase/templates/login-email.html`](supabase/templates/login-email.html).

## How the port works

The app started as one 450 KB HTML file. It is being migrated with the **strangler pattern**: the new app ships from day one looking and behaving exactly like the original, and pieces move into React one at a time.

| Path | What it is |
|---|---|
| `src/content/program.ts` | The program as typed data: 6 days, 46 exercises, cues, MVIC activation, citations. **Source of truth.** |
| `src/components/workout/` | `Workout` → `DayContent` → `ExerciseCard`, rendered from `program.ts`. |
| `src/styles/protocol.css` | The original design system, ported verbatim (fonts self-hosted via `next/font`). |
| `src/legacy/fragments.ts` | Sections not yet ported to React (hero, tracker, gauge, volume matrix, anatomy, sources…). |
| `public/legacy/protocol.js` | The original client logic, loaded after hydration by `LegacyRuntime`. Shrinks as features move to React. |
| `reference/protocol.html` | Frozen snapshot of the original single-file app. |
| `scripts/extract-legacy.mjs` | One-shot generator that produced the files above from the reference. |
| `scripts/verify-legacy.tsx` | `npm run verify:legacy`: proves the React workout markup is node-for-node identical to the original. |

**Permanent IDs:** exercise keys (`push-a1` … `legs-b7`) and set indices are storage keys. Saved logs and old JSON backups depend on them, so never rename them.

## Roadmap

1. ✅ Next.js port, pixel-identical to the original, live on Vercel
2. ✅ Supabase auth (email code) + Postgres schema with row-level security
3. ✅ Cloud sync of sets, logs, notes and settings (offline-first, last-write-wins); old JSON backups upload via Import Backup
4. Port legacy sections and logic to React components; PWA / offline support back
