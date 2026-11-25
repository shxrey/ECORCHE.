'use client';

import { useEffect, useMemo, useState } from 'react';
import { days } from '@/content/program';
import { trainingStore, useSecondClock, useTraining } from '@/lib/training/client';
import { dayProgress } from '@/lib/training/progress';
import { useHydrated } from '@/lib/useHydrated';
import { useView } from '@/lib/view';
import { hush } from './voice';
import { formatClock, formatElapsed, toggleTempo, toggleWorkoutMode, useRest, useTempo, useWorkoutMode } from './workout';

const RING_CIRCUMFERENCE = 2 * Math.PI * 12;
const ICON = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;

/**
 * The sticky session bar in the rebuilt training core: the shown day's name,
 * progress and workout timer, the rest countdown, and the switches for voice
 * cues, high contrast, the tempo pacer and Workout Mode. Shown once the hero
 * scrolls out of view, and always in Workout Mode. Same markup as the
 * original page until it's live.
 */
export function TrainingMinibar() {
  const hydrated = useHydrated();
  const view = useView();
  const doneMap = useTraining((s) => s.doneMap);
  const audio = useTraining((s) => s.prefs.audio);
  const highContrast = useTraining((s) => s.prefs.highContrast);
  const timers = useTraining((s) => s.timers);
  const rest = useRest();
  const tempo = useTempo();
  const workoutMode = useWorkoutMode();
  const dayId = `${view.group}${view.day}`;
  // The workout timer runs from the day's first ticked set until Reset.
  const startedAt = timers[dayId];
  const now = useSecondClock(!!startedAt);
  const day = days.find((d) => d.id === dayId)!;
  const progress = useMemo(() => dayProgress(doneMap, dayId), [doneMap, dayId]);
  const fraction = progress.total ? progress.done / progress.total : 0;

  // Shown once the hero has scrolled away (an observer, not a scroll listener).
  const [heroGone, setHeroGone] = useState(false);
  useEffect(() => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setHeroGone(!entry.isIntersecting), { rootMargin: '-120px 0px 0px 0px', threshold: 0 });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  const toggleAudio = () => {
    const next = !audio;
    trainingStore().setPrefs({ audio: next });
    // Stop anything mid-sentence the moment voice cues are muted.
    if (!next) hush();
  };

  return (
    <div className={heroGone || workoutMode ? 'session-minibar visible' : 'session-minibar'} id="sessionMinibar">
      <span className="mb-day" id="mbDay">
        {day.title} {day.letter}
      </span>{' '}
      <span className="mb-progress" id="mbProgress">
        {progress.done}/{progress.total} sets
      </span>
      {hydrated ? (
        <span id="mbSessionTimer" style={{ color: 'var(--accent-bright)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginLeft: '8px' }}>
          {startedAt ? formatElapsed(now - startedAt) : '00:00'}
        </span>
      ) : null}
      <div className="mb-progress-ring" aria-hidden="true">
        <svg width="30" height="30" viewBox="0 0 30 30">
          <circle className="mb-ring-track" cx="15" cy="15" r="12" />
          <circle
            className="mb-ring-fill"
            id="mbRingFill"
            cx="15"
            cy="15"
            r="12"
            strokeDasharray="75.4"
            strokeDashoffset="75.4"
            style={hydrated ? { strokeDashoffset: RING_CIRCUMFERENCE * (1 - fraction) } : undefined}
          />
        </svg>
        <span className="mb-ring-text" id="mbRingText">
          {Math.round(fraction * 100)}%
        </span>
      </div>
      <span className="mb-rest" id="mbRest">
        {rest.visible ? `${formatClock(rest.remaining)} rest` : null}
      </span>
      <button
        type="button"
        className={hydrated && !audio ? 'mb-audio-btn muted' : 'mb-audio-btn'}
        id="mbAudioBtn"
        onClick={toggleAudio}
        aria-label="Toggle rest-timer voice announcements"
        title={hydrated ? `Rest-timer voice announcements: ${audio ? 'on' : 'off'}` : 'Rest-timer voice announcements'}
        aria-pressed={audio}
      >
        <svg id="mbAudioIcon" {...ICON}>
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          {audio ? (
            <>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </>
          ) : (
            <>
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </>
          )}
        </svg>
      </button>
      <button
        type="button"
        className={hydrated && highContrast ? 'mb-audio-btn active' : 'mb-audio-btn'}
        id="mbHighContrastBtn"
        onClick={() => trainingStore().setPrefs({ highContrast: !highContrast })}
        aria-label="Toggle high contrast gym mode"
        title="High contrast gym mode"
        aria-pressed={highContrast}
      >
        <svg {...ICON}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor" stroke="none" />
        </svg>
      </button>
      <button
        type="button"
        className={tempo.active ? 'mb-audio-btn active' : 'mb-audio-btn'}
        id="mbTempoBtn"
        onClick={toggleTempo}
        aria-label="Toggle tempo pacer (3 second lower, 1 second stretch hold, explosive up)"
        title="Tempo pacer: 3-1-X"
        aria-pressed={tempo.active}
      >
        <svg {...ICON}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>
      <button type="button" className="minibar-kiosk-btn" id="kioskMinibarBtn" onClick={toggleWorkoutMode}>
        {workoutMode ? 'Finish Workout' : 'Start Workout'}
      </button>
    </div>
  );
}
