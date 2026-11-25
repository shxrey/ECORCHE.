/**
 * The training store in the browser: one per page, on localStorage, with
 * React hooks. The page's tracker, workout and session bar run on it; the
 * keys and formats are the old script's, so data saved before the switch-over
 * (25 Nov 2026) reads as it was.
 *
 * Components read with useTraining(select). `select` must return a piece of
 * the state as it is (doneMap, prefs.unit…), not a new object: work out
 * derived values (progress, counts) in the component.
 */
import { useSyncExternalStore } from 'react';
import { dateKey } from './dates';
import { emptyTrainingState, TrainingStore } from './store';
import type { TrainingState } from './types';

let store: TrainingStore | null = null;
const writeErrorListeners = new Set<(error: unknown) => void>();

/** The page's store, created on first use (browser only). */
export function trainingStore(): TrainingStore {
  store ??= new TrainingStore(window.localStorage, {
    onWriteError: (error) => writeErrorListeners.forEach((listener) => listener(error)),
  });
  return store;
}

/** Called when saving fails (usually storage full). */
export function onTrainingWriteError(listener: (error: unknown) => void): () => void {
  writeErrorListeners.add(listener);
  return () => writeErrorListeners.delete(listener);
}

const subscribe = (listener: () => void) => trainingStore().subscribe(listener);
/** What the server draws, and the page shows until it's live: nothing ticked or logged, default preferences. */
const SERVER_STATE: TrainingState = emptyTrainingState();

// One minute-ticker shared by every component that shows "today".
const clockListeners = new Set<() => void>();
let clockTimer: ReturnType<typeof setInterval> | null = null;
const subscribeToClock = (listener: () => void) => {
  clockListeners.add(listener);
  clockTimer ??= setInterval(() => clockListeners.forEach((l) => l()), 60_000);
  return () => {
    clockListeners.delete(listener);
    if (!clockListeners.size && clockTimer) {
      clearInterval(clockTimer);
      clockTimer = null;
    }
  };
};

/** Today's date key ("2026-11-25"), rolling over at midnight; '' in the server HTML. */
export function useToday(): string {
  return useSyncExternalStore(subscribeToClock, () => dateKey(), () => '');
}

// A second-ticker for running clocks, only while something is counting.
const secondListeners = new Set<() => void>();
let secondTimer: ReturnType<typeof setInterval> | null = null;
let lastSecond = 0;
const subscribeToSeconds = (listener: () => void) => {
  secondListeners.add(listener);
  secondTimer ??= setInterval(() => {
    lastSecond = Date.now();
    secondListeners.forEach((l) => l());
  }, 1000);
  return () => {
    secondListeners.delete(listener);
    if (!secondListeners.size && secondTimer) {
      clearInterval(secondTimer);
      secondTimer = null;
    }
  };
};
const noClock = () => () => {};
/** The time now, as of the latest whole-second tick (so it holds still between ticks). */
const readSecond = () => {
  const now = Date.now();
  if (now - lastSecond >= 1000) lastSecond = now;
  return lastSecond;
};

/** The current time (ms), updated every second while `running`; 0 in the server HTML. */
export function useSecondClock(running: boolean): number {
  return useSyncExternalStore(running ? subscribeToSeconds : noClock, readSecond, () => 0);
}

/** A piece of the training state; re-renders only when that piece changes. */
export function useTraining<T>(select: (state: TrainingState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(trainingStore().getState()),
    () => select(SERVER_STATE),
  );
}
