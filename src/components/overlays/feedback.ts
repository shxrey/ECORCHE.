/**
 * Toasts, the "Are you sure?" dialog and screen-reader announcements, as
 * tiny stores any component can use: showToast(…), askToConfirm(…),
 * announce(…). <Overlays /> draws them, in the same markup as the original page.
 */
import { useSyncExternalStore } from 'react';

function createSignal<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    use(): T {
      return useSyncExternalStore(this.subscribe, this.get, () => initial);
    },
  };
}

// ---------- toasts ----------

export interface Toast {
  id: number;
  message: string;
  /** Shows an Undo button; the toast closes once it's used. */
  undo?: () => void;
}

const toasts = createSignal<Toast[]>([]);
let nextToastId = 0;

/** A message at the bottom of the screen: 3.5 s, or 5 s when it offers Undo. */
export function showToast(message: string, undo?: () => void): void {
  const id = ++nextToastId;
  toasts.set([...toasts.get(), { id, message, undo }]);
  setTimeout(() => dismissToast(id), undo ? 5000 : 3500);
}

export function dismissToast(id: number): void {
  toasts.set(toasts.get().filter((t) => t.id !== id));
}

export const useToasts = () => toasts.use();

// ---------- "Are you sure?" ----------

interface Confirmation {
  message: string;
  onConfirm: () => void;
}

const confirmation = createSignal<Confirmation | null>(null);
/** The last question asked: it stays in the dialog while it fades out. */
let lastQuestion = '';

/** Opens the dialog; `onConfirm` runs only if the lifter presses Confirm. */
export function askToConfirm(message: string, onConfirm: () => void): void {
  lastQuestion = message;
  confirmation.set({ message, onConfirm });
}

/** Closes the dialog: Confirm runs the action; Cancel, ✕, Escape and the backdrop don't. */
export function answerConfirm(confirmed: boolean): void {
  const pending = confirmation.get();
  confirmation.set(null);
  if (confirmed && pending) pending.onConfirm();
}

export function useConfirmation(): { open: boolean; message: string } {
  const pending = confirmation.use();
  return { open: !!pending, message: pending?.message ?? lastQuestion };
}

// ---------- announcements ----------

const announcement = createSignal('');

/**
 * Says something to screen readers (a sighted lifter sees it already: an
 * exercise completed, a PR). Kept to milestones, not every tap.
 */
export function announce(message: string): void {
  announcement.set(message);
}

export const useAnnouncement = () => announcement.use();
