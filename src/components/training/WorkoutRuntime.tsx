'use client';

import { useEffect } from 'react';
import { viewStore } from '@/lib/view';
import { warmUpVoices } from './voice';
import { finishWorkoutMode, hideRest, inWorkoutMode, keepScreenOn, letScreenSleep, stopTempo, subscribeWorkoutMode, tempoActive, tickRest } from './workout';

/** What Workout Mode fades away: everything but the session bar, the workout and the rest timer. */
const HIDDEN_IN_WORKOUT_MODE = ['.top-nav', '.hero', '#tracker', '#protocol', '#standards', '#gauge', '#volume', '#anatomy', '#sources', '.site-footer', '.standards-fab'];

/**
 * Fades an element out or back in. A data attribute, not classes, so a
 * component re-rendering its className can't undo it (overrides.css):
 * "fade" animates opacity, "hidden" is faded out, "collapsed" takes it out
 * of the layout once the fade is done.
 */
function setFade(el: HTMLElement, state: string) {
  el.dataset.kiosk = state;
}

/**
 * The page-wide side of the rebuilt training core's gym tools, drawing
 * nothing (the tools themselves are workout.ts):
 * - Workout Mode: fades and folds away the rest of the page, scrolls to the
 *   shown day, swipes between Day A and B, keeps the screen on;
 * - showing another day hides the rest timer;
 * - back in the tab, the rest timer catches up at once (phones throttle a
 *   background tab's timers); leaving it stops the tempo pacer.
 */
export function WorkoutRuntime() {
  useEffect(() => {
    warmUpVoices();
    let on = inWorkoutMode();
    let collapseTimer: ReturnType<typeof setTimeout> | undefined;
    const elements = () => HIDDEN_IN_WORKOUT_MODE.map((sel) => document.querySelector<HTMLElement>(sel)).filter((el): el is HTMLElement => !!el);

    const stopWorkoutMode = subscribeWorkoutMode(() => {
      if (inWorkoutMode() === on) return;
      on = inWorkoutMode();
      document.body.classList.toggle('kiosk-mode', on);
      clearTimeout(collapseTimer);
      const els = elements();
      if (on) {
        els.forEach((el) => {
          setFade(el, 'fade');
          void el.offsetWidth; // a reflow first, so the fade plays
          setFade(el, 'fade hidden');
        });
        collapseTimer = setTimeout(() => els.forEach((el) => setFade(el, 'fade hidden collapsed')), 380);
        const { group, day } = viewStore.get();
        setTimeout(() => document.getElementById(`${group}${day}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      } else {
        els.forEach((el) => {
          setFade(el, 'fade hidden');
          void el.offsetWidth;
          setFade(el, 'fade');
        });
      }
    });

    const stopView = viewStore.subscribe(hideRest);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        tickRest();
        if (inWorkoutMode()) keepScreenOn(); // the phone drops the wake lock when the tab is left
      } else {
        letScreenSleep();
        if (tempoActive()) stopTempo(); // no buzzing and talking with nobody looking
      }
    };

    // A clear sideways swipe in Workout Mode: left for Day B, right for Day A
    // (for when the phone is on the floor mid-set). Steep or short moves are
    // left alone, so scrolling still works.
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const onTouchStart = (e: TouchEvent) => {
      if (!inWorkoutMode() || e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!tracking) return;
      tracking = false;
      if (!inWorkoutMode()) return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (navigator.vibrate) navigator.vibrate(15);
      viewStore.showDay(dx < 0 ? 'B' : 'A');
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      // Leaving the page: nothing keeps buzzing, counting or holding the screen on.
      stopTempo();
      hideRest();
      finishWorkoutMode();
      stopWorkoutMode();
      stopView();
      clearTimeout(collapseTimer);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return null;
}
