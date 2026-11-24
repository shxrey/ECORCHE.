# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ÉCORCHÉ (https://ecorche.app): a 6-day Push/Pull/Legs hypertrophy tracker. Next.js 16 (App Router, TypeScript), Supabase (Postgres + Auth + RLS), Resend for sign-in email, deployed on Vercel. Every push to `main` on github.com/shxrey/ECORCHE. (formerly blueprint-ppl) auto-deploys to production. The legacy code is being replaced in phases: see `docs/react-rebuild-plan.md` before starting that work. Nightly encrypted database backups: `docs/backups.md`.

## Commands

```bash
npm run dev             # http://localhost:3000
npm run build
npm run lint
npm run typecheck       # next typegen && tsc --noEmit
npm run test:db         # applies every migration to in-memory Postgres (PGlite), tests RLS + sync_push/sync_pull
npm run test:unit       # node:test via tsx, every src/**/*.test.ts: sync engine, training rules and store, auth helpers
npm run test:e2e        # Playwright (e2e/): builds, serves on 127.0.0.1:3100, always signed out. BACKUP_DIR=<folder> also imports those backup files
npm run extract:legacy  # regenerates the legacy-derived files (see below)
npm run verify:legacy   # proves the workout and every ported section render the same DOM as the original
npm run test:visual     # pixel comparison against an older build you serve yourself; steps in docs/react-rebuild-plan.md
```

To run one test file: `npx tsx --test src/lib/sync/sync.test.ts`. To run one case, add `--test-name-pattern "<name>"`.

Without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, the app runs local-only (localStorage) and hides account features (`src/lib/supabase/config.ts`). Both values are public. Never add a service_role/secret key to this app.

## Architecture: a strangler-pattern port

The app began as one 450 KB HTML file (`reference/protocol.html`, frozen). It still runs mostly as that original vanilla-JS app inside a Next.js shell, and sections move into React one at a time.

**Generated files: change the generator, not the output.** `scripts/extract-legacy.mjs` reads `reference/protocol.html` and writes:
- `src/styles/protocol.css`: the original styles. Fonts now come from `next/font`, and the hand-written `-webkit-backdrop-filter` lines are removed.
- `src/content/program.ts`: the 6 days and 46 exercises as typed data (types in `src/content/types.ts`).
- `src/legacy/fragments.ts`: the sections not yet ported (nav, hero, tracker, overlays) as raw HTML strings, rendered by `LegacyFragment`.
- `public/legacy/protocol.js`: the original `<script>` logic, plus a bootstrap and the sync bridge.

The sections' original HTML comes from `scripts/legacy-fragments.mjs`, shared with `verify:legacy`. Its `PORTED` list names the sections now in React (`src/components/sections/`, content in `src/content/`): they're left out of `fragments.ts` but still checked against the original. To port another: write the component, add it to `PORTED` and to `SECTIONS` in `scripts/verify-legacy.tsx`, and remove its old script code with a `cuts` entry in the extractor.

To change legacy behaviour or markup, add a string-replacement entry to the extractor's `patches` array (each one throws if its target text is missing), or a `cuts` entry to delete code between two markers, or edit the snippet files it splices in (`scripts/legacy-bridge.js`, `legacy-units.js`, `legacy-labels.js`). Then run `extract:legacy` and commit the regenerated files with the change. If you hand-edit a generated file, the next extract silently overwrites it. `program.ts` has never been hand-edited since the first port. Check with the user before treating it as hand-maintained.

**Runtime wiring** (`src/app/page.tsx`): `LegacyFragment` sections, the React sections and `Workout` (`src/components/workout/`) render on the server. The interactive sections (Volume, Anatomy and Sources tabs, study lists) are small client components; they render exactly the original markup first (`useHydrated`), and never change the class of an element that fades in on scroll, because the old script marks those with `visible`. Workout markup carries `data-legacy-onclick`/`onkeydown`, which the bootstrap turns back into inline handlers. After hydration, `LegacyRuntime` injects `/legacy/protocol.js` once per document. Any link into or out of the protocol page must therefore be a `DocumentLink` (a plain `<a>` that forces a full page load). Client-side navigation would leave the legacy UI dead.

**Cloud sync** (`src/lib/sync`, `src/components/sync/CloudSync.tsx`): offline-first. The legacy app owns state in globals (`doneMap`, `logMap`, `notesMap`, `sessionsMap`, timers, prefs) persisted to localStorage. `scripts/legacy-bridge.js` exposes `window.__legacyBridge` (`readState`/`applyState`/`isBusy`) and fires `legacy:change` by wrapping the `save*` functions. The extractor asserts that every global the bridge touches exists. `model.ts` flattens state into keyed records (`c|`, `l|`, `n|`, `d|`, `t|`, `s`; mapping documented at its top). `engine.ts` diffs records against a shadow copy and queues them in an outbox (localStorage `hb_sync_v1`). It syncs through the Postgres RPCs `sync_push`/`sync_pull`, which resolve conflicts last-write-wins per record on the server, with tombstones for deletes. The engine takes injected bridge/remote/store interfaces (`adapters.ts`), so `sync.test.ts` can simulate two devices without a browser.

**Training rules and store** (`src/lib/training/`, not wired into the page yet): the old script's calculations as pure typed modules (e1RM, ▲/▼, PRs, history lookups, warm-ups, progress, volume, CSV, backups) and `TrainingStore`, which reads and writes the same localStorage keys and formats as the old app. `e2e/parity.spec.ts` checks them against the running old page; where they differ on purpose (bug fixes), the spec and `docs/react-rebuild-plan.md` say so. Phase 3 of the rebuild moves the page onto them.

**Auth**: passwordless email OTP (`/login`, `/auth/confirm`). `src/proxy.ts` (Next 16's name for middleware) only refreshes the session cookie. All data access control is Postgres RLS (`auth.uid() = user_id`). The Supabase JS client loads lazily (`src/lib/supabase/load.ts`), and only when a session cookie exists, to keep it off signed-out page loads.

**Database**: migrations in `supabase/migrations/` (0001 onward) are applied to prod by hand in the Supabase SQL Editor, in order. `test:db` replays them the same way (0001 with existing data, then the rest) and grants nothing outside the migrations. Every new table or function needs its grants and RLS policies in its own migration.

**Security headers/CSP** are in `next.config.ts`. `connect-src` allows only self plus the Supabase URL (https and wss). Inline scripts stay allowed because legacy markup uses inline handlers.

## Invariants

- Exercise keys (`push-a1` … `legs-b7`), set indices, and local-timezone `YYYY-MM-DD` date keys are storage keys. Saved logs, synced rows and old JSON backups depend on them, so never rename them. Saved weights are always kg. The kg/lb setting only changes display.
- Keep the original visual design (Anton / Inter / JetBrains Mono, neon Flame/Moss/Frost glows, long-scroll layout) unless the user asks for a redesign. Don't restyle with Tailwind or generic component libraries.
- Program content (cues, MVIC %, citations) lives in repo content files. The database holds only per-user data.
- `public/legacy/**` and the extractor snippet files are excluded from ESLint on purpose: their functions are called from inline handlers.
