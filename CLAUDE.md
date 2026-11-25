# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

ÉCORCHÉ (https://ecorche.app): a 6-day Push/Pull/Legs hypertrophy tracker. Next.js 16 (App Router, TypeScript), Supabase (Postgres + Auth + RLS), Resend for sign-in email, deployed on Vercel. Every push to `main` on github.com/shxrey/ECORCHE. (formerly blueprint-ppl) auto-deploys to production. The page was rebuilt in React in phases, keeping the original's look, markup and saved data (`docs/react-rebuild-plan.md`; Phase 5 is optional). Nightly encrypted database backups: `docs/backups.md`.

## Commands

```bash
npm run dev             # http://localhost:3000
npm run build
npm run lint
npm run typecheck       # next typegen && tsc --noEmit
npm run test:db         # applies every migration to in-memory Postgres (PGlite), tests RLS + sync_push/sync_pull
npm run test:unit       # node:test via tsx, every src/**/*.test.ts: sync engine, training rules and store, auth helpers
npm run test:e2e        # Playwright (e2e/): builds, serves on 127.0.0.1:3100, always signed out; tests "/". BACKUP_DIR=<folder> also imports those backup files through the page (never commit them)
npm run extract:program # regenerates src/content/program.ts from reference/protocol.html (see below)
npm run verify:legacy   # proves every section and the workout render the same DOM as the original page
npm run test:visual     # pixel comparison against an older build you serve yourself; steps in docs/react-rebuild-plan.md
```

To run one test file: `npx tsx --test src/lib/sync/sync.test.ts`. To run one case, add `--test-name-pattern "<name>"`.

Without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`, the app runs local-only (localStorage) and hides account features (`src/lib/supabase/config.ts`). Both values are public. Never add a service_role/secret key to this app.

## Architecture

The app began as one 450 KB HTML file (`reference/protocol.html`, frozen). It has been rebuilt in React with the same markup, styles and saved-data formats; nothing from the original script runs any more.

**Generated file: change the generator, not the output.** `scripts/extract-program.mjs` (`npm run extract:program`) reads the workout in `reference/protocol.html` and writes `src/content/program.ts`: the 6 days and 46 exercises as typed data (types in `src/content/types.ts`). If you hand-edit it, the next extract silently overwrites it. `program.ts` has never been hand-edited since the first port. Check with the user before treating it as hand-maintained.

**Checked against the original:** `verify:legacy` renders each section's component and the workout to HTML and compares them node by node with the original page (`scripts/legacy-fragments.mjs` holds its sections, with the rebrand edits). Markup changes only when the user asks (the redesign will); update the check with them.

**Styles** (`src/styles/`): `protocol.css` imports the original stylesheet split by part of the page (`src/styles/protocol/*.css`) in the original order. Later rules win ties, so keep that order and put a rule in its part's file. `overrides.css` loads after them (fixes and additions since the port). `auth.css` and `legal.css` style the account, sign-in and legal pages.

**Runtime wiring** (`src/app/page.tsx`): the shell is `src/components/shell/` (`TopNav` and its phone menu, `Hero`, `PageEffects`: colour theme, address, scroll reveal in `reveal.ts`, smooth in-page scrolling), the reading sections are `src/components/sections/` (content in `src/content/`), and the tracker, workout, session bar, timers and pop-ups are `src/components/training/` and `src/components/overlays/`. Those run on the training store (`src/lib/training/client.ts`: `trainingStore()`, `useTraining(select)`), which keeps the original app's localStorage keys and formats. Which group and day is showing lives in the view store (`src/lib/view.ts`), which keeps the `#legsA` address in step. Client components render exactly the original markup first (`useHydrated`). The scroll reveal and Workout Mode mark elements with data attributes (`data-revealed`, `data-kiosk`, styled in `overrides.css`), so a component may rewrite its element's classes. Links between pages are `DocumentLink` (full page loads). `/preview`, where the rebuild was tried first, is a temporary redirect to `/`.

**Cloud sync** (`src/lib/sync`, `src/components/sync/CloudSync.tsx`): offline-first. The training store holds the state (`doneMap`, `logMap`, `notesMap`, `sessionsMap`, timers, prefs) in localStorage; `adapters.trainingStoreBridge` connects sync to it (`readState`/`applyState`, and the lifter's own changes are announced, not what sync applies). `model.ts` flattens state into keyed records (`c|`, `l|`, `n|`, `d|`, `t|`, `s`; mapping documented at its top). `engine.ts` diffs records against a shadow copy and queues them in an outbox (localStorage `hb_sync_v1`). It syncs through the Postgres RPCs `sync_push`/`sync_pull`, which resolve conflicts last-write-wins per record on the server, with tombstones for deletes. The engine takes injected bridge/remote/store interfaces (`adapters.ts`), so `sync.test.ts` can simulate two devices without a browser.

**Training rules and store** (`src/lib/training/`): the old script's calculations as pure typed modules (e1RM, ▲/▼, PRs, history lookups, warm-ups, progress, volume, CSV, backups) and `TrainingStore`, which reads and writes the same localStorage keys and formats as the old app. Before the switch-over they were checked against the running old page (`e2e/parity.spec.ts`, now deleted); where they differ on purpose (bug fixes), `docs/react-rebuild-plan.md` says so. `e2e/saved-data.spec.ts` checks the page against them on random histories.

**Auth**: passwordless email OTP (`/login`, `/auth/confirm`). `src/proxy.ts` (Next 16's name for middleware) only refreshes the session cookie. All data access control is Postgres RLS (`auth.uid() = user_id`). The Supabase JS client loads lazily (`src/lib/supabase/load.ts`), and only when a session cookie exists, to keep it off signed-out page loads.

**Database**: migrations in `supabase/migrations/` (0001 onward) are applied to prod by hand in the Supabase SQL Editor, in order. `test:db` replays them the same way (0001 with existing data, then the rest) and grants nothing outside the migrations. Every new table or function needs its grants and RLS policies in its own migration.

**Security headers/CSP** are in `next.config.ts`. `connect-src` allows only self plus the Supabase URL (https and wss). Inline event handlers are blocked (`script-src-attr 'none'`), so handle events in React, never through `on…=` attributes or HTML strings (`e2e/security.spec.ts`). Inline `<script>` elements stay allowed: Next.js inlines each page's data, and a nonce instead would render every page per request.

## Invariants

- Exercise keys (`push-a1` … `legs-b7`), set indices, and local-timezone `YYYY-MM-DD` date keys are storage keys. Saved logs, synced rows and old JSON backups depend on them, so never rename them. Saved weights are always kg. The kg/lb setting only changes display.
- Keep the original visual design (Anton / Inter / JetBrains Mono, neon Flame/Moss/Frost glows, long-scroll layout) unless the user asks for a redesign. Don't restyle with Tailwind or generic component libraries.
- Program content (cues, MVIC %, citations) lives in repo content files. The database holds only per-user data.
