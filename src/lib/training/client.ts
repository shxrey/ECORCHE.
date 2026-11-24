/**
 * The training store in the browser: one per page, on localStorage, with
 * React hooks. Used by the rebuilt training core (/preview for now); the
 * live page still runs the old script, which reads and writes the same keys.
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

/** A piece of the training state; re-renders only when that piece changes. */
export function useTraining<T>(select: (state: TrainingState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(trainingStore().getState()),
    () => select(SERVER_STATE),
  );
}
