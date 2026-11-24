# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ÉCORCHÉ (https://ecorche.app): a 6-day Push/Pull/Legs hypertrophy tracker. Next.js 16 (App Router, TypeScript), Supabase (Postgres + Auth + RLS), Resend for sign-in email, deployed on Vercel. Every push to `main` on github.com/shxrey/blueprint-ppl auto-deploys to production.

## Commands

```bash
npm run dev             # http://localhost:3000
npm run build
npm run lint
npm run typecheck       # next typegen && tsc --noEmit
npm run test:db         # applies every migration to in-memory Postgres (PGlite), tests RLS + sync_push/sync_pull
npm run test:sync       # node:test via tsx: sync engine, session cookie, feedback
npm run extract:legacy  # regenerates the legacy-derived files (see below)
npm run verify:legacy   # proves React's <Workout /> renders the same DOM as reference/protocol.html
```

To run one test file: `npx tsx --test src/lib/sync/sync.test.ts`. To run one case, add `--test-name-pattern "<name>"`.

Without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, the app runs local-only (localStorage) and hides account features (`src/lib/supabase/config.ts`). Both values are public. Never add a service_role/secret key to this app.

## Architecture: a strangler-pattern port

The app began as one 450 KB HTML file (`reference/protocol.html`, frozen). It still runs mostly as that original vanilla-JS app inside a Next.js shell, and sections move into React one at a time.

**Generated files: change the generator, not the output.** `scripts/extract-legacy.mjs` reads `reference/protocol.html` and writes:
- `src/styles/protocol.css`: the original styles. Fonts now come from `next/font`, and the hand-written `-webkit-backdrop-filter` lines are removed.
- `src/content/program.ts`: the 6 days and 46 exercises as typed data (types in `src/content/types.ts`).
- `src/legacy/fragments.ts`: non-workout sections as raw HTML strings, rendered by `LegacyFragment`.
- `public/legacy/protocol.js`: the original `<script>` logic, plus a bootstrap and the sync bridge.

To change legacy behaviour or markup, add a string-replacement entry to the extractor's `patches` array (each one throws if its target text is missing), or edit the snippet files it splices in (`scripts/legacy-bridge.js`, `legacy-units.js`, `legacy-labels.js`). Then run `extract:legacy` and commit the regenerated files with the change. If you hand-edit a generated file, the next extract silently overwrites it. `program.ts` has never been hand-edited since the first port. Check with the user before treating it as hand-maintained.

**Runtime wiring** (`src/app/page.tsx`): `LegacyFragment` sections and the React `Workout` (`src/components/workout/`) render on the server. Workout markup carries `data-legacy-onclick`/`onkeydown`, which the bootstrap turns back into inline handlers. After hydration, `LegacyRuntime` injects `/legacy/protocol.js` once per document. Any link into or out of the protocol page must therefore be a `DocumentLink` (a plain `<a>` that forces a full page load). Client-side navigation would leave the legacy UI dead.

**Cloud sync** (`src/lib/sync`, `src/components/sync/CloudSync.tsx`): offline-first. The legacy app owns state in globals (`doneMap`, `logMap`, `notesMap`, `sessionsMap`, timers, prefs) persisted to localStorage. `scripts/legacy-bridge.js` exposes `window.__legacyBridge` (`readState`/`applyState`/`isBusy`) and fires `legacy:change` by wrapping the `save*` functions. The extractor asserts that every global the bridge touches exists. `model.ts` flattens state into keyed records (`c|`, `l|`, `n|`, `d|`, `t|`, `s`; mapping documented at its top). `engine.ts` diffs records against a shadow copy and queues them in an outbox (localStorage `hb_sync_v1`). It syncs through the Postgres RPCs `sync_push`/`sync_pull`, which resolve conflicts last-write-wins per record on the server, with tombstones for deletes. The engine takes injected bridge/remote/store interfaces (`adapters.ts`), so `sync.test.ts` can simulate two devices without a browser.

**Auth**: passwordless email OTP (`/login`, `/auth/confirm`). `src/proxy.ts` (Next 16's name for middleware) only refreshes the session cookie. All data access control is Postgres RLS (`auth.uid() = user_id`). The Supabase JS client loads lazily (`src/lib/supabase/load.ts`), and only when a session cookie exists, to keep it off signed-out page loads.

**Database**: migrations in `supabase/migrations/` (0001 onward) are applied to prod by hand in the Supabase SQL Editor, in order. `test:db` replays them the same way (0001 with existing data, then the rest) and grants nothing outside the migrations. Every new table or function needs its grants and RLS policies in its own migration.

**Security headers/CSP** are in `next.config.ts`. `connect-src` allows only self plus the Supabase URL (https and wss). Inline scripts stay allowed because legacy markup uses inline handlers.

## Invariants

- Exercise keys (`push-a1` … `legs-b7`), set indices, and local-timezone `YYYY-MM-DD` date keys are storage keys. Saved logs, synced rows and old JSON backups depend on them, so never rename them. Saved weights are always kg. The kg/lb setting only changes display.
- Keep the original visual design (Anton / Inter / JetBrains Mono, neon Flame/Moss/Frost glows, long-scroll layout) unless the user asks for a redesign. Don't restyle with Tailwind or generic component libraries.
- Program content (cues, MVIC %, citations) lives in repo content files. The database holds only per-user data.
- `public/legacy/**` and the extractor snippet files are excluded from ESLint on purpose: their functions are called from inline handlers.
