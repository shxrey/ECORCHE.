'use client';

import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { announce } from '@/components/overlays/feedback';
import { DetailBlockView, MetaPill } from '@/components/workout/ExerciseCard';
import type { Exercise } from '@/content/types';
import { trainingStore, useTraining } from '@/lib/training/client';
import { setKey } from '@/lib/training/progress';
import { useHydrated } from '@/lib/useHydrated';
import { LastLogged, LogPanel } from './LogPanel';
import { useExerciseLog } from './useExerciseLog';

/** The name as shown in the card's heading, suffix included ("Barbell Back Squats Peak Intensity"). */
export function displayName(ex: Exercise): string {
  return ex.nameSuffix ? `${ex.name} ${ex.nameSuffix.text}` : ex.name;
}

/**
 * Opens or closes a card's body with a height animation. Opening animates to
 * the measured height, then lifts the cap so the body can grow (notes, etc.);
 * closing snaps to the current height first, since CSS can't animate from "none".
 */
function animateBody(card: HTMLElement, body: HTMLElement, inner: HTMLElement, open: boolean) {
  if (open) {
    body.style.maxHeight = inner.scrollHeight + 'px';
    const onEnd = (e: TransitionEvent) => {
      if (e.target !== body || e.propertyName !== 'max-height') return;
      if (card.classList.contains('expanded')) body.style.maxHeight = 'none';
      body.removeEventListener('transitionend', onEnd);
    };
    body.addEventListener('transitionend', onEnd);
  } else {
    body.style.maxHeight = inner.scrollHeight + 'px';
    void body.offsetHeight; // one reflow, so there's a height to animate from
    body.style.maxHeight = '0px';
  }
}

/**
 * One exercise in the rebuilt training core: tap the header (or Enter / Space)
 * to open it, tap a set button to tick or untick that set (ticking also saves
 * that set's boxes). Once the page is live it gets its session log ("Last:"
 * in the header, the log panel in the body). A card whose sets are all ticked
 * is marked complete. Same markup as the original page.
 */
export function TrainingExerciseCard({
  exercise: ex,
  dayId,
  expanded,
  onToggle,
}: {
  exercise: Exercise;
  dayId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hydrated = useHydrated();
  const doneMap = useTraining((s) => s.doneMap);
  const card = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const done = ex.setDots.map((dot) => hydrated && !!doneMap[setKey(ex.key, dot.idx)]);
  const complete = done.length > 0 && done.every(Boolean);
  const name = displayName(ex);
  const log = useExerciseLog(ex);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (card.current && body.current && inner.current) animateBody(card.current, body.current, inner.current, expanded);
  }, [expanded]);

  // "Squats complete." for screen readers, when a tap finishes the exercise.
  const tapped = useRef(false);
  const wasComplete = useRef(complete);
  useEffect(() => {
    if (complete && !wasComplete.current && tapped.current) announce(`${name} complete.`);
    wasComplete.current = complete;
    tapped.current = false;
  }, [complete, name]);

  const tick = (idx: string) => {
    tapped.current = true;
    const nowDone = trainingStore().toggleSet(dayId, ex.key, idx);
    if (!nowDone) return; // unticking never erases what was logged
    if (navigator.vibrate) navigator.vibrate(50);
    // A ticked set was done: save what its boxes hold (only this set).
    log.commit(idx, { whenEdited: false });
  };

  const onHeaderClick = (e: MouseEvent) => {
    if ((e.target as Element).closest('.set-tracker')) return;
    onToggle();
  };
  const onHeaderKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      onToggle();
    }
  };

  const classes = ['exercise-card', 'reveal'];
  if (expanded) classes.push('expanded');
  if (complete) classes.push('kiosk-complete', 'exercise-complete');
  const pillClass = ex.pillVariant ? `meta-pill ${ex.pillVariant}` : 'meta-pill';

  return (
    <div ref={card} className={classes.join(' ')} data-exercise={ex.key}>
      <div className="exercise-header" onClick={onHeaderClick} role="button" tabIndex={0} aria-expanded={expanded} onKeyDown={onHeaderKey}>
        <div className="exercise-number">{ex.number}</div>
        <div className="exercise-info">
          <h3>
            {ex.name}
            {ex.nameSuffix ? ' ' : null}
            {ex.nameSuffix ? (
              <span style={{ color: ex.nameSuffix.tone === 'danger' ? 'var(--danger-bright)' : 'var(--ink-muted)', fontWeight: 600 }}>{ex.nameSuffix.text}</span>
            ) : null}
          </h3>
          <div className="muscle-tags">
            {ex.tags.map((tag) => (
              <span key={tag.label} className={`muscle-tag tag-${tag.tone}`}>
                {tag.label}
              </span>
            ))}
          </div>
          {hydrated ? <LastLogged exKey={ex.key} log={log} /> : null}
        </div>
        <div className="exercise-meta">
          <MetaPill className={pillClass} label="Sets" value={ex.sets} />
          <MetaPill className={pillClass} label="Reps" value={ex.reps} />
          <MetaPill className={pillClass} label="RIR" value={ex.rir} />
        </div>
        <div className="set-tracker" onClick={(e) => e.stopPropagation()}>
          {ex.setDots.map((dot, i) => (
            <button
              key={dot.idx}
              type="button"
              className={done[i] ? 'set-dot done' : 'set-dot'}
              onClick={() => tick(dot.idx)}
              data-set-idx={dot.idx}
              aria-label={hydrated ? `${name}, set ${dot.idx}` : undefined}
              aria-pressed={hydrated ? done[i] : undefined}
            >
              {dot.label}
            </button>
          ))}
        </div>
        <div className="expand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
      <div ref={body} className="exercise-body">
        <div ref={inner} className="exercise-body-inner">
          <div className="body-grid">
            {ex.blocks.map((block, i) => (
              <DetailBlockView key={i} block={block} />
            ))}
          </div>
          {hydrated ? <LogPanel exKey={ex.key} name={name} log={log} /> : null}
        </div>
      </div>
    </div>
  );
}
