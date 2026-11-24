'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { askToConfirm, showToast } from '@/components/overlays/feedback';
import { Accent, SectionIntro } from '@/components/sections/SectionIntro';
import { trainingStore, useTraining } from '@/lib/training/client';
import { trainingWeekBanner, weekProgress, type TrainingDayId } from '@/lib/training/progress';
import { useHydrated } from '@/lib/useHydrated';
import { useView, viewStore } from '@/lib/view';
import type { DayLetter, Group } from '@/content/types';
import { fireConfetti } from './confetti';

/** The six day cards, in the tracker's order (the weekly order). */
const DAY_CARDS: { id: TrainingDayId; group: Group; letter: DayLetter; session: string; name: string; color: string }[] = [
  { id: 'legsA', group: 'legs', letter: 'A', session: '01', name: 'Leg Day A', color: 'var(--frost)' },
  { id: 'pushA', group: 'push', letter: 'A', session: '02', name: 'Push Day A', color: 'var(--flame)' },
  { id: 'pullA', group: 'pull', letter: 'A', session: '03', name: 'Pull Day A', color: 'var(--moss)' },
  { id: 'legsB', group: 'legs', letter: 'B', session: '04', name: 'Leg Day B', color: 'var(--frost)' },
  { id: 'pushB', group: 'push', letter: 'B', session: '05', name: 'Push Day B', color: 'var(--flame)' },
  { id: 'pullB', group: 'pull', letter: 'B', session: '06', name: 'Pull Day B', color: 'var(--moss)' },
];

const RING_CIRCUMFERENCE = 2 * Math.PI * 54;
const IDLE_TEXT = 'Zero sets logged this week. The bar is waiting.';
const INFO_TEXT = 'Tracks every working set across all 6 sessions — Leg A/B, Push A/B and Pull A/B. Progress persists locally in this browser between visits.';

/**
 * "Weekly Progress Tracker": the training-week banner, kg/lb and Auto-Rest
 * switches, the week ring, a card per day (tap to jump to it), and the data
 * buttons. Rebuilt training core (/preview); history, export, import and
 * auto-backup arrive in Phase 3d, so those buttons do nothing yet.
 *
 * The server HTML is the original page's; the live numbers fill in once the
 * page is running.
 */
export function Tracker() {
  const hydrated = useHydrated();
  const view = useView();
  const doneMap = useTraining((s) => s.doneMap);
  const week = useTraining((s) => s.prefs.mesocycleWeek);
  const unit = useTraining((s) => s.prefs.unit);
  const autoRest = useTraining((s) => s.prefs.autoRest);
  const progress = useMemo(() => weekProgress(doneMap), [doneMap]);
  const banner = trainingWeekBanner(week);
  const [celebrating, setCelebrating] = useState(false);
  const celebrated = useRef(false);

  // A completed week: confetti, and the heading says so for 6 seconds.
  useEffect(() => {
    if (!hydrated) return;
    if (progress.fraction >= 1 && !celebrated.current) {
      celebrated.current = true;
      fireConfetti();
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 6000);
      return () => clearTimeout(t);
    }
    if (progress.fraction < 1) celebrated.current = false;
  }, [hydrated, progress.fraction]);

  const setUnit = (next: 'kg' | 'lb') => {
    if (next === unit) return;
    trainingStore().setPrefs({ unit: next });
    showToast(`Weights now in ${next === 'lb' ? 'pounds (lb)' : 'kilograms (kg)'}. Your logged history is unchanged.`);
  };

  const resetWeek = () =>
    askToConfirm('Reset ALL progress across every session this week? This can be undone for a few seconds after.', () => {
      const undo = trainingStore().resetWeek();
      showToast('Reset entire week.', undo);
    });

  const jumpTo = (group: Group, day: DayLetter) => {
    viewStore.show(group, day);
    document.getElementById('workout')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="section" id="tracker">
      <SectionIntro eyebrow="Your Week" title={<>Weekly <Accent>Progress Tracker</Accent></>}>
        Every set you log on any of the 6 days below is saved automatically in this browser, so your progress is still here next time you open this file. Tap a day card to jump straight to it.
      </SectionIntro>
      <div className={hydrated && banner.deload ? 'mesocycle-banner deload' : 'mesocycle-banner'} id="mesocycleBanner">
        {hydrated ? banner.text : null}
      </div>

      <div className="tracker-panel reveal">
        <div className="tracker-settings-row">
          <div className="unit-toggle" role="group" aria-label="Weight unit">
            <span className="unit-toggle-label" aria-hidden="true">
              Units
            </span>
            {(['kg', 'lb'] as const).map((u) => (
              <button key={u} type="button" className={u === unit ? 'active' : undefined} data-unit={u} aria-pressed={u === unit} onClick={() => setUnit(u)}>
                {u}
              </button>
            ))}
          </div>
          <label className="auto-rest-toggle">
            <input type="checkbox" id="autoRestToggle" checked={autoRest} onChange={(e) => trainingStore().setPrefs({ autoRest: e.target.checked })} />
            <span className="auto-rest-switch" aria-hidden="true" />{' '}
            <span className="auto-rest-label">
              <span className="arl-title">Auto-Rest</span> <span className="arl-sub">Start rest timer when a set is marked done</span>
            </span>
          </label>
        </div>

        <div className="tracker-top">
          <div className="tracker-ring-wrap">
            <svg viewBox="0 0 128 128">
              <defs>
                <linearGradient id="trackerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#369973" />
                  <stop offset="50%" stopColor="#E8B23D" />
                  <stop offset="100%" stopColor="#E45228" />
                </linearGradient>
              </defs>
              <circle className="tracker-ring-bg" cx="64" cy="64" r="54" />
              <circle
                className="tracker-ring-fill"
                id="masterRing"
                cx="64"
                cy="64"
                r="54"
                strokeDasharray="339.3"
                strokeDashoffset="339.3"
                style={hydrated ? { strokeDashoffset: RING_CIRCUMFERENCE * (1 - progress.fraction) } : undefined}
              />
            </svg>
            <div className="tracker-ring-text">
              <span className="big" id="masterRingText">
                {Math.round(progress.fraction * 100)}%
              </span>
              <span className="small" id="masterRingSets">
                {progress.done}/{progress.total} sets
              </span>
            </div>
          </div>
          <div className="tracker-info">
            <h5>{celebrating ? 'Week complete. Recovery starts now.' : 'Full Week Completion'}</h5>
            <p>{hydrated && progress.done === 0 ? IDLE_TEXT : INFO_TEXT}</p>
          </div>
        </div>

        <div className="tracker-week-grid" id="trackerWeekGrid">
          {DAY_CARDS.map((card) => {
            const day = progress.days[card.id];
            const cap = card.id.charAt(0).toUpperCase() + card.id.slice(1);
            const classes = ['tracker-day-card'];
            if (day.complete) classes.push('complete');
            if (hydrated && view.group === card.group && view.day === card.letter) classes.push('active-day');
            return (
              <button key={card.id} className={classes.join(' ')} data-jump={card.group} data-day={card.letter} onClick={() => jumpTo(card.group, card.letter)}>
                <div className="tracker-day-label">
                  <span>Session {card.session}</span>
                  <span className="dot" style={{ background: card.color }} />
                </div>
                <div className="tracker-day-name">{card.name}</div>
                <div className="tracker-day-bar">
                  <div
                    className="tracker-day-bar-fill"
                    id={`bar${cap}`}
                    style={{ transform: `scaleX(${(Math.min(day.done / day.total, 1) * 100) / 100})`, background: card.color }}
                  />
                </div>
                <div className="tracker-day-count" id={`count${cap}`}>
                  {day.done}/{day.total} sets
                </div>
              </button>
            );
          })}
        </div>

        <div className="tracker-reset-all">
          <button className="reset-btn">View History</button>
          <button className="reset-btn">Export Backup</button>
          <button className="reset-btn">Export CSV</button>
          <button className="reset-btn" id="autoBackupBtn">
            Enable Auto-Backup
          </button>
          <button className="reset-btn">Import Backup</button>
          <input type="file" id="importFileInput" aria-label="Backup file to import" accept="application/json" style={{ display: 'none' }} />
          <button className="reset-btn" onClick={resetWeek}>
            Reset Entire Week
          </button>
        </div>
      </div>
    </section>
  );
}
