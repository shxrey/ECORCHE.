# React rebuild plan

**Status:** proposed 24 November 2026. Tick steps off here as they land.

The protocol page still runs mostly as the original single-file app: 11 sections of raw HTML
(`src/legacy/fragments.ts`) plus about 3,000 lines of vanilla JavaScript
(`public/legacy/protocol.js`, roughly 40 features). This plan moves all of it into
typed React components, then deletes the old code. It comes before the gothic redesign,
because redesigning React components is far easier than redesigning generated HTML strings.

## Ground rules

1. **It looks and behaves the same.** Same CSS, same class names, same markup. Every section
   is checked against the original before it ships. Visual changes wait for the redesign.
2. **Nobody loses anything.** Same localStorage keys, the same backup file format, the same
   sync records, exercise keys and `#legsA`-style links. Old backups still import.
3. **Small steps, each one live.** Every step ships on its own and leaves the site working.
   The riskiest part (Phase 3) is built at a hidden preview address first.
4. **Known bugs get fixed as their code is rewritten**, not copied across.

## Where we start (measured 24 Nov 2026)

| | Now |
|---|---|
| Old HTML sections | 11 (nav, hero, tracker, protocol, standards, gauge, volume, anatomy, sources, footer, overlays): 90 KB |
| Old script | 3,002 lines, ~40 features, 53 inline `on…=` handlers in the HTML |
| Home page HTML | 614 KB unpacked (60 KB downloaded): 235 KB visible + 374 KB repeated for React |
| Scripts, signed out | 183 KB downloaded / 591 KB unpacked |

The 374 KB repeat is how Next.js sends server-rendered pages (the HTML, plus the same
content as data for React). The rebuild alone won't remove it; Phase 5 looks at that
separately.

## Phase 0: Safety net (about 1 session)

Nothing visible changes. This makes every later step safe to check.

- [x] **Behaviour tests** (Playwright, run with `npm run test:e2e` against a production
      build). Done 24 Nov: 28 tests in `e2e/`, passing three runs in a row (~40 s),
      plus 1 `test.fixme` for the suggestions bug, to switch on in 3b. Written against
      *today's* app so they pin down what it does now:
      tick sets and see day/week progress; log weight, reps and RIR; suggestions from last
      session; "Last session", e1RM, trend bars, ▲/▼ badges and PRs; warm-up steps; kg/lb;
      notes are dated; rest timer and session timer; undo toast; reset day and week; export,
      then import, a backup; CSV header; Workout Mode, swiping days; `#pushB` survives a
      reload; high contrast and voice settings stick; the sync bridge's `readState` /
      `applyState` contract.
- [x] **Pure logic in typed, tested modules** (`src/lib/training/`): e1RM, the PR rule, the
      ▲/▼ rule, warm-up rounding, "last time this set" lookup, weekly counts, training week,
      backup checking and cleaning, CSV. Done 24 Nov: `dates`, `units`, `strength`, `history`,
      `prescription` (rest, RIR target, warm-ups), `progress`, `volume`, `csv`, `backup`.
      `e2e/parity.spec.ts` loads random but repeatable histories into the old page and checks
      every card line, box, badge, count and both exports against the modules (46 exercises,
      kg and lb).
- [x] **One typed store design** for the training state (today's `LegacyState`), reading and
      writing the same localStorage keys, with tests that load real old backups. Done 24 Nov:
      `src/lib/training/store.ts` (`TrainingStore`: immutable state for
      `useSyncExternalStore`, the same keys and formats, debounced saves, `readState` /
      `applyState` for sync). Fixtures in every format ever exported are in
      `src/lib/training/fixtures/`; the old page and the store read each other's saved data;
      the 8 real backups exported in Jul–Aug 2026 import identically both ways. Run
      `BACKUP_DIR=<folder> npm run test:e2e` to check other real files (never commit them:
      the repo is public).

Phase 0 found four more old-app bugs. Each has a parked `test.fixme` that shows the right
behaviour; the new modules already behave correctly:
- **PR wiped by an edit** (3b): re-saving a set compares it with its own earlier save today,
  so typing the RIR after a PR erases it. The new rule: beat every set from earlier days.
- **PR tag gone after a reload** (3b): the lasting "PR" tag is never drawn when the page loads.
- **"This week" is 0 on Sundays** (3d): View History keeps the time of day in the week's
  start. Weeks now run Monday–Sunday, which is what the old page showed the other six days.
- **One bad date in a backup** (3d, already fixed in `backup.ts`): the old page filed that
  exercise's whole history under today as junk sets, then failed to draw them. Now only the
  bad day is dropped. (Only hand-edited files can have one.)

## Phase 1: Static sections (1–2 sessions)

Lowest risk: mostly content, with small interactions.

- [x] Protocol, Standards, Intensity gauge, Footer → server components. (25 Nov, 4981878)
- [x] Volume (animated bars + tap to highlight) → small client component. (25 Nov, aa65660)
- [x] Anatomy (tabs) and Sources (tabs + "show more studies"). (25 Nov)

Each one ships alone: compare its rendered markup to the original (extend
`verify:legacy`), then remove its HTML fragment and its old script section.

Done 25 Nov. All seven are in `src/components/sections/`; their content (Volume cards,
Anatomy tabs, studies) is typed data in `src/content/`. Raw HTML left on the page fell from
95 KB to 19 KB (nav, hero, tracker, overlays). Checks: `verify:legacy` (identical markup,
spaces included), `e2e/sections.spec.ts` (tabs, show more, bars, highlight, no console
errors), and the pixel check below (22 screenshots identical to the pre-Phase-1 site). The
old script keeps Volume's "N logged so far" lines until Phase 3. Two quirks kept as they
were: the Pull tab's muscle grid doesn't fade in, and Volume cards can't be reached by
keyboard (the redesign can fix both).

### Pixel check (`npm run test:visual`)

Screenshots of each ported section (desktop and phone, plus clicked states) compared
pixel for pixel with the version before the change. Baselines are per machine and never
committed (`visual/*-snapshots/` is ignored). To check a change:

1. Build the old version in a separate folder and serve it:
   `git worktree add --detach ../hypertrophy-baseline <commit before the change>`, then in
   that folder `npm ci`, copy `.env.local` in, `npx next build`, `npx next start -p 3200`.
2. `VISUAL_BASE=http://127.0.0.1:3200 npm run test:visual -- --update-snapshots` takes the
   baselines; run it again to see they're stable. Take them the same day you compare:
   this laptop's text rendering shifted slightly overnight once (25 Nov), so day-old
   baselines failed even against the unchanged site.
3. Serve the new build on 3100 (`npm run build`, `npx next start -p 3100`) and run
   `npm run test:visual`. Add the new sections and states to `visual/pixel.spec.ts` first.
4. Afterwards: stop both servers and `git worktree remove ../hypertrophy-baseline`.

`verify:legacy` can't see CSS: a space between two `div`s only shows if they're styled to
sit inline (the hero's badge and tabs are). That one was caught by this pixel check.

## Phase 2: Page shell (1 session)

- [x] Top nav, phone menu, smooth scrolling, scroll reveal, background particles. (25 Nov)
- [x] Hero: Push / Pull / Legs and Day A / B switching, and the `#legsA` address routing.
- [x] A small view store (which group and day is showing), which the remaining old code
      reads through the bridge until Phase 3 replaces it.

Done 25 Nov. `src/components/shell/`: `TopNav` (nav and phone menu), `Hero`, `SessionMinibar`
(markup only; the old script still runs it until 3c), `PageEffects` (colour theme, address,
fade-ins, smooth scrolling) and `reveal.ts`. The view store is `src/lib/view.ts`; the old
script reaches it as `window.__view` (follows it with `applyView`, asks it for changes from
the tracker's day cards and Workout Mode swipes) and replays a day's fade-in through
`window.__reveal`. `LegacyRuntime` hands both over before the script loads. Raw HTML left:
the tracker and the pop-ups (12.7 KB), which move with the training core.

Checks: `verify:legacy` (nav and hero identical; it reports which inline handlers moved to
React), `e2e/shell.spec.ts` (13 tests, also run against the old site), and the pixel check
(35 screenshots identical, including the nav, phone menu, mini-bar and four hero states).
Two small behaviour changes, both deliberate: tapping the day that's already showing no
longer replays its cards' animation or hides a running rest timer; and the phone only buzzes
on a real tap, not on page load (that load-time buzz was the console error Chrome logged).

## Phase 3: The training core (3–4 sessions, at a hidden preview address first)

Built at `/preview` (hidden from search), so you can use it on your phone while ecorche.app
keeps today's version. Both read the same saved data. When the behaviour tests pass and
you're happy, `/` switches over.

- [x] **3a. State, saving and sync:** the store replaces the old globals, the sync engine
      connects to it directly (no bridge), plus the set tracker: set dots, day and week
      progress, ring, training-week banner, reset day and week with undo. Flush the store on
      `visibilitychange` / `pagehide`, call `reload()` on the window `storage` event, and let
      `src/lib/sync/device.ts` read through `loadTrainingState`.
  - Done 25 Nov. `/preview` (`src/app/preview/page.tsx`, not crawled or indexed, a "Preview"
    label in the corner) runs on the training store; the old script doesn't load there, so
    the two never write the data at once. `src/lib/training/client.ts` holds the page's
    store and `useTraining(select)`; `TrainingRuntime` saves on hide, reloads on another
    tab's save, warns once when storage is full, applies high contrast. New components in
    `src/components/training/`: `Tracker`, `TrainingWorkout` (days, cards opening one at a
    time, set buttons, day ring, Reset Day), `TrainingMinibar` (day, progress, voice and
    contrast switches) and `confetti.ts`; `src/components/overlays/` has the pop-ups
    (`Overlays`, with toasts, "Are you sure?", the "?" reference and the announcer in
    `feedback.ts`). Volume's "N logged so far" lines come from the store there
    (`<Volume liveCounts />`). `CloudSync source="store"` syncs through `trainingStoreBridge`.
  - The scroll reveal also marks elements with `data-revealed` (same effect, in
    `overrides.css`), so React components can change an element's classes freely.
  - Fix: an exercise with every set ticked keeps its "complete" mark after a reload (the old
    page only marked it on a tap or in Workout Mode).
  - Checks: `verify:legacy` (its server HTML is the original page's), the "preview" project
    in `playwright.config.ts` (30 tests there, including `e2e/preview.spec.ts`: random
    histories show right, and each page reads exactly what the other saved), and the pixel
    check's "preview" project (identical to the live page, except the session bar's "00:00"
    timer, which comes with 3c).
  - Waiting on later steps, so they did nothing on `/preview` at first: the log boxes (3b),
    the rest timer, tempo pacer, Workout Mode and the session timer (3c), and View History,
    Export, Import and Auto-Backup (3d).
- [x] **3b. Logging:** weight, reps and RIR boxes; suggestions; dated notes; "Last session";
      e1RM; trend bars; ▲/▼ badges; PRs and confetti; warm-up; kg/lb; screen-reader names.
  - Fix: only the set you actually confirm is saved, not the suggested numbers in the
    card's other rows.
  - Fix: on phones the ▲/▼ badge moves under the boxes instead of being cut off.
  - Fix: a PR stays a PR when its set is edited again, and its tag shows after a reload.
  - Done 25 Nov (6dc5cc4). `useExerciseLog` (per card: boxes start from today's saved set or
    last time's as a dashed suggestion; typing stays in the row until it's confirmed by
    leaving a box, Enter, or ticking the set; notes save 400 ms after typing stops) and
    `LogPanel` (same markup as the old page's injected panel). The old page never fired
    confetti for a PR, only for a finished week, so neither does this.
  - All four fixes are tests that are parked on the live page and pass on `/preview`. The
    phone one at 360px wide: the old page's badges ran 21-34px past the card there (6-19px
    at 375px, only "hold" by 4px at 390px). `e2e/cards.ts` (shared with `parity.spec.ts`)
    checks every card's boxes, lines and badges on `/preview` against the modules on random
    histories. Pixel check: an open card with history is identical to the live page's.
- [x] **3c. Timers and Workout Mode:** rest timer, auto-rest and voice cues; session timer
      (synced); tempo pacer; the mini-bar; Workout Mode, swiping days, keeping the screen awake;
      high contrast.
  - Done 25 Nov. `src/components/training/workout.ts` holds the rest timer (counted from its
    end time, so a throttled background tab stays right; the chime's audio is unlocked in the
    tap), the tempo pacer (3 s down, 1 s hold, explosive up; stops when the tab is left) and
    Workout Mode, as small shared stores (`src/lib/signal.ts`, now also used by the pop-ups).
    `voice.ts` speaks the cues with an on-device English voice when there is one.
    `WorkoutRuntime` does the page-wide part: fading the rest of the page, scrolling to the
    day, swiping Day A/B, the screen wake lock, catching the timer up on return. The mini-bar
    shows the workout timer (`useSecondClock`, ticking only while one runs) and "1:30 rest".
  - Workout Mode marks what it hides with a `data-kiosk` attribute (same steps as the old
    classes, in `overrides.css`), so React can't undo it by redrawing a class.
  - Small differences: the mini-bar's "rest" countdown shows at once and follows ±15 (the old
    page waited for the next tick), and leaving `/preview` by an in-app link stops the
    pacer, the timer and Workout Mode.
  - New tests on both pages: ±15, dismiss and the mini-bar countdown; Workout Mode hiding and
    restoring the page; Escape closing a dialog before leaving Workout Mode; the "Next:" line
    and a finished card folding away. The pixel check's session bar now matches too.
- [x] **3d. Data tools:** history, export and import (same file format), CSV, auto-backup,
      confirm dialogs and toasts.
  - Fix: on Sundays, View History counts that day's sets in this week.
  - Done 25 Nov. `src/components/training/dataTools.ts` wires the tracker's buttons to the
    file formats from Phase 0 (`backup.ts`, `csv.ts`): Export Backup and Export CSV download
    the same files as before; Import Backup checks the whole file, says what's in it and
    replaces the progress only on Confirm (then saves at once); Auto-Backup rewrites the
    chosen file 5 s after the last change, for this visit. Session History is a live
    dialog in `Overlays` (this week and last week, Monday to Sunday, and 14 days of bars);
    ✕, Escape and the backdrop close it.
  - Small differences: "Auto-backup enabled" only shows if the first write worked (the old
    page said so even when it had just failed and switched off), and leaving `/preview`
    turns auto-backup off.
  - `e2e/data.spec.ts` now runs on `/preview` too, with new tests on both pages: the 14 bars
    and closing the dialog, cancelling an import, a file over 5 MB, auto-backup's writes
    (a stand-in save dialog) and a browser without it. The Sunday test is parked on the
    live page and passes on `/preview`. Pixel check: Session History with two weeks of
    sets is identical to the live page's, at both widths.
- [ ] Switch `/` to the new core.

## Phase 4: Clean-up (1 session)

- [ ] Delete `protocol.js`, `fragments.ts`, the bridge and the extractor's legacy parts.
- [ ] With no inline handlers left, the security policy can stop allowing inline scripts:
      a real security improvement.
- [ ] Split `protocol.css` by component (same rules, same look). Update `CLAUDE.md`.

## Phase 5: Lighter page (optional; measure first)

With everything in React, re-measure the 614 KB page. Options include loading the long
research notes, Anatomy and Sources only when opened. The trade-off is search: Google
indexes what's in the first HTML, and that research is part of the pitch. Decide with numbers.

## Risks and how they're handled

| Risk | Handling |
|---|---|
| Subtle old behaviours get lost (the old code documents dozens) | Phase 0 behaviour tests; every old comment read during porting |
| Data loss or format drift | Same keys and formats; tests with real old backups; the sync tests stay green |
| Slower on phones (46 cards, 443 boxes) | Per-exercise subscriptions, no whole-page re-renders; measure on a phone-sized screen |
| A broken day at the gym | Phase 3 at `/preview` first; nightly backups; each step can be reverted on its own |

## Needs your OK before starting

- **Playwright**: a dev-only test tool. It downloads a test browser (about 150 MB) onto your
  laptop, and nothing changes on the website.
- **The `/preview` approach** for Phase 3.

## After this

The gothic / dark-academia redesign, then the installable app (PWA), then the campus launch.
Before launch: raise the sign-in email limits (see the audit notes).
