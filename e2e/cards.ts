/**
 * Reading every exercise card's session log off a page, and what the
 * training modules say it should show: shared by e2e/parity.spec.ts (the old
 * page) and e2e/preview.spec.ts (the rebuilt core at /preview).
 */
import type { Page } from '@playwright/test';
import { exercises } from '../src/content/program';
import { lastEarlierNote, lastLoggedText, lastSessionText, lastTimeThisSet, setBoxes } from '../src/lib/training/history';
import { isEasierThanPrescribed, restSeconds, targetRirMax, warmupSteps } from '../src/lib/training/prescription';
import { compareToLastTime, currentEstimate, loadTrend } from '../src/lib/training/strength';
import type { TrainingState } from '../src/lib/training/types';
import { formatEstimate, weightBoxToKg } from '../src/lib/training/units';
import { TODAY } from './random-data';

type Fn = (...args: unknown[]) => unknown;

/**
 * Everything a page shows for every exercise. Each card's warm-up steps are
 * opened first. `oldPage` also reads two of the old script's rules that
 * aren't drawn anywhere (rest length, RIR target).
 */
export function readCards(page: Page, { oldPage }: { oldPage: boolean }) {
  return page.evaluate(async (old) => {
    document.querySelectorAll<HTMLElement>('.warmup-toggle-btn').forEach((b) => b.click());
    await new Promise((r) => setTimeout(r, 100));
    const w = window as unknown as Record<string, Fn>;
    const text = (id: string) => document.getElementById(id)?.textContent ?? null;
    const out: Record<string, unknown> = {};
    document.querySelectorAll<HTMLElement>('.exercise-card').forEach((card) => {
      const ex = card.dataset.exercise!;
      out[ex] = {
        lastLog: text('lastLog-' + ex),
        lastSession: text('lastSession-' + ex),
        est: text('est1rm-' + ex),
        lastNote: text('lastNote-' + ex),
        trend: [...document.querySelectorAll<HTMLElement>(`#loadSpark-${ex} .ls-bar`)].map((b) => [parseFloat(b.style.height), b.title]),
        warmup: text('warmupCalc-' + ex),
        notes: card.querySelector<HTMLTextAreaElement>('.exercise-notes')!.value,
        ...(old && { rest: w.repRangeToSeconds(card.querySelector('.set-dot')), rirMax: w.getTargetRIRMax(card) }),
        rows: [...card.querySelectorAll('.set-log-row')].map((row) => {
          const box = (c: string) => row.querySelector<HTMLInputElement>(c)!;
          return {
            weight: box('.log-weight').value,
            weightKg: box('.log-weight').getAttribute('data-kg'),
            reps: box('.log-reps').value,
            rir: box('.log-rir').value,
            suggested: { weight: box('.log-weight').classList.contains('log-input-suggested'), reps: box('.log-reps').classList.contains('log-input-suggested') },
            badge: [row.querySelector('.delta-badge')!.className, row.querySelector('.delta-badge')!.textContent],
            easy: row.classList.contains('rir-easy'),
            prMarker: !!row.querySelector('.pr-persistent-badge'),
          };
        }),
      };
    });
    return out;
  }, oldPage);
}

/**
 * What the modules say a page should show (same shape as readCards).
 * The old page never draws the lasting "PR" tag on load (its function is out
 * of reach of the code that fills the boxes); the rebuilt core does.
 */
export function expectedCards(state: TrainingState, { oldPage }: { oldPage: boolean }) {
  const unit = state.prefs.unit;
  const out: Record<string, unknown> = {};
  for (const ex of exercises) {
    const history = state.logMap[ex.key];
    const est = currentEstimate(history, TODAY);
    const note = lastEarlierNote(state.notesMap[ex.key], TODAY);
    const steps = warmupSteps(setBoxes(history, 1, TODAY, unit).weight, unit);
    out[ex.key] = {
      lastLog: lastLoggedText(history, TODAY, unit),
      lastSession: lastSessionText(history, TODAY, unit),
      est: est ? 'Est. 1RM: ~' + formatEstimate(est, unit) : '',
      lastNote: note ? `Last note (${note.date}): ${note.text}` : '',
      trend: loadTrend(history).map((p) => [p.height, p.date + (p.est ? ': ~' + formatEstimate(p.est, unit) + ' e1RM' : ': no weight logged')]),
      warmup: steps ? steps.map((s) => `${s.pct}%: ${s.weight}${unit}`).join('') : "Enter set 1's weight first.",
      notes: state.notesMap[ex.key]?.[TODAY] ?? '',
      ...(oldPage && { rest: restSeconds(ex.reps), rirMax: targetRirMax(ex.rir) }),
      rows: ex.setDots.map((dot) => {
        const b = setBoxes(history, dot.idx, TODAY, unit);
        const delta = compareToLastTime(weightBoxToKg(b.weight, b.weightKg, unit), b.reps, lastTimeThisSet(history, dot.idx, TODAY), unit);
        return {
          weight: b.weight,
          weightKg: b.weightKg,
          reps: b.reps,
          rir: b.rir,
          suggested: b.suggested,
          badge: [delta ? `delta-badge ${delta.className}` : 'delta-badge', delta ? delta.text : ''],
          easy: isEasierThanPrescribed(b.rir, targetRirMax(ex.rir)),
          prMarker: oldPage ? false : b.pr,
        };
      }),
    };
  }
  return out;
}

/** Takes out the trend bars' heights: the browser keeps only ~6 digits of them, so they're compared to within 0.01 px. */
export function splitHeights(cards: Record<string, unknown>) {
  const heights: Record<string, number[]> = {};
  for (const [ex, c] of Object.entries(cards) as [string, { trend: [number, string][] }][]) {
    heights[ex] = c.trend.map(([h]) => h);
    c.trend = c.trend.map(([, title]) => [0, title]);
  }
  return heights;
}
