'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { askToConfirm, showToast } from '@/components/overlays/feedback';
import { reveal } from '@/components/shell/reveal';
import { displayName } from '@/content/names';
import { days, exerciseByKey } from '@/content/program';
import type { Day } from '@/content/types';
import { trainingStore, useTraining } from '@/lib/training/client';
import { dayProgress, setKey } from '@/lib/training/progress';
import { useHydrated } from '@/lib/useHydrated';
import { useView } from '@/lib/view';
import { TrainingExerciseCard } from './TrainingExerciseCard';
import { inWorkoutMode, subscribeWorkoutMode, toggleWorkoutMode, useWorkoutMode } from './workout';

const RING_CIRCUMFERENCE = 2 * Math.PI * 24;

/** All six training days, one shown at a time (the view store's), in the rebuilt training core. */
export function TrainingWorkout() {
  return (
    <div id="workout">
      {days.map((day) => (
        <TrainingDay key={day.id} day={day} />
      ))}
    </div>
  );
}

/**
 * One training day: header, progress ring, Reset Day (asks first, then
 * offers Undo), Start / Finish Workout, and its exercise cards, one open at a
 * time. Same markup as the original page; it shows the server's Legs A until
 * the page is live.
 */
function TrainingDay({ day }: { day: Day }) {
  const hydrated = useHydrated();
  const view = useView();
  const shown = hydrated ? `${view.group}${view.day}` === day.id : day.active;
  const doneMap = useTraining((s) => s.doneMap);
  const progress = useMemo(() => dayProgress(doneMap, day.id), [doneMap, day.id]);
  const [openCard, setOpenCard] = useState<string | null>(null);
  const workoutMode = useWorkoutMode();
  const root = useRef<HTMLDivElement>(null);
  const cap = day.id.charAt(0).toUpperCase() + day.id.slice(1); // "pushA" -> "PushA"
  const label = `${day.title} ${day.letter}`;

  // When the day is shown (on load too), its headings and cards play their entrance again.
  useEffect(() => {
    if (!hydrated || !shown) return;
    const t = setTimeout(() => {
      const el = root.current;
      if (!el) return;
      el.querySelectorAll('.reveal').forEach((r) => reveal.replay(r));
      const cards = el.querySelectorAll<HTMLElement>('.exercise-card');
      cards.forEach((c) => (c.style.animation = 'none'));
      void el.offsetWidth; // one reflow for the whole day, so the animations restart
      cards.forEach((c, i) => {
        c.style.animation = 'fadeUp 0.5s ease forwards';
        c.style.animationDelay = `${i * 0.06}s`;
      });
    }, 40);
    return () => clearTimeout(t);
  }, [hydrated, shown]);

  // Starting Workout Mode folds away an open exercise that's already finished.
  useEffect(
    () =>
      subscribeWorkoutMode(() => {
        if (!inWorkoutMode()) return;
        const done = trainingStore().getState().doneMap;
        setOpenCard((open) => (open && exerciseByKey[open].setDots.every((dot) => done[setKey(open, dot.idx)]) ? null : open));
      }),
    [],
  );

  const resetDay = () =>
    askToConfirm('Reset all logged sets for this day? This can be undone for a few seconds after.', () => {
      const undo = trainingStore().resetDay(day.id);
      showToast(`Reset ${label}.`, undo);
    });

  return (
    <div ref={root} className={shown ? 'day-content active' : 'day-content'} id={day.id}>
      <section className="section" id={day.sectionId}>
        <div className="section-eyebrow reveal">{day.eyebrow}</div>
        <h2 className="section-title reveal">
          {day.title} <span className="accent">{day.letter}</span>
        </h2>
        <p className="section-subtitle reveal" dangerouslySetInnerHTML={{ __html: day.subtitleHtml }} />

        <div className="progress-bar-wrap reveal">
          <div className="progress-ring">
            <svg viewBox="0 0 58 58">
              <circle className="progress-ring-bg" cx="29" cy="29" r="24" />
              <circle
                className="progress-ring-fill"
                id={`ring${cap}`}
                cx="29"
                cy="29"
                r="24"
                strokeDasharray="150.8"
                strokeDashoffset="150.8"
                style={hydrated ? { strokeDashoffset: RING_CIRCUMFERENCE * (1 - Math.min(progress.done / progress.total, 1)) } : undefined}
              />
            </svg>
            <div className="progress-ring-text" id={`ringText${cap}`}>
              {progress.done}/{progress.total}
            </div>
          </div>
          <div className="progress-info">
            <h5>{day.progressHeading}</h5>
            <p>{day.progressHint}</p>
          </div>
          <button className="reset-btn" onClick={resetDay}>
            {day.resetLabel}
          </button>
          {hydrated ? (
            <button type="button" className="progress-kiosk-btn" onClick={toggleWorkoutMode}>
              {workoutMode ? 'Finish Workout' : 'Start Workout'}
            </button>
          ) : null}
        </div>

        <div className="exercise-list">
          {day.exerciseKeys.map((key, i) => {
            const next = day.exerciseKeys[i + 1];
            return (
              <TrainingExerciseCard
                key={key}
                exercise={exerciseByKey[key]}
                dayId={day.id}
                nextName={next ? displayName(exerciseByKey[next]) : null}
                expanded={openCard === key}
                onToggle={() => setOpenCard((open) => (open === key ? null : key))}
                onClose={() => setOpenCard((open) => (open === key ? null : open))}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
