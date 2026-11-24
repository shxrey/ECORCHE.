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
- [ ] **Pure logic in typed, tested modules** (`src/lib/training/`): e1RM, the PR rule, the
      ▲/▼ rule, warm-up rounding, "last time this set" lookup, weekly counts, training week,
      backup checking and cleaning, CSV.
- [ ] **One typed store design** for the training state (today's `LegacyState`), reading and
      writing the same localStorage keys, with tests that load real old backups.

## Phase 1: Static sections (1–2 sessions)

Lowest risk: mostly content, with small interactions.

- [ ] Protocol, Standards, Intensity gauge, Footer → server components.
- [ ] Volume (animated bars + tap to highlight) → small client component.
- [ ] Anatomy (tabs) and Sources (tabs + "show more studies").

Each one ships alone: compare its rendered markup to the original (extend
`verify:legacy`), then remove its HTML fragment and its old script section.

## Phase 2: Page shell (1 session)

- [ ] Top nav, phone menu, smooth scrolling, scroll reveal, background particles.
- [ ] Hero: Push / Pull / Legs and Day A / B switching, and the `#legsA` address routing.
- [ ] A small view store (which group and day is showing), which the remaining old code
      reads through the bridge until Phase 3 replaces it.

## Phase 3: The training core (3–4 sessions, at a hidden preview address first)

Built at `/preview` (hidden from search), so you can use it on your phone while ecorche.app
keeps today's version. Both read the same saved data. When the behaviour tests pass and
you're happy, `/` switches over.

- [ ] **3a. State, saving and sync:** the store replaces the old globals, the sync engine
      connects to it directly (no bridge), plus the set tracker: set dots, day and week
      progress, ring, training-week banner, reset day and week with undo.
- [ ] **3b. Logging:** weight, reps and RIR boxes; suggestions; dated notes; "Last session";
      e1RM; trend bars; ▲/▼ badges; PRs and confetti; warm-up; kg/lb; screen-reader names.
  - Fix: only the set you actually confirm is saved, not the suggested numbers in the
    card's other rows.
  - Fix: on phones the ▲/▼ badge moves under the boxes instead of being cut off.
- [ ] **3c. Timers and Workout Mode:** rest timer, auto-rest and voice cues; session timer
      (synced); tempo pacer; the mini-bar; Workout Mode, swiping days, keeping the screen awake;
      high contrast.
- [ ] **3d. Data tools:** history, export and import (same file format), CSV, auto-backup,
      confirm dialogs and toasts.
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
