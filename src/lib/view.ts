/**
 * Which training day the page is showing: one of six (Push / Pull / Legs × A / B).
 *
 * The hero's buttons, the address ("#pushB"), the page's colour theme and
 * the workout all follow this one store. The address keeps the shown day across reloads,
 * and a link or bookmark to "/#pullB" opens Pull B.
 *
 * Works with React's useSyncExternalStore (subscribe / get).
 */
import { useSyncExternalStore } from 'react';
import type { DayLetter, Group } from '@/content/types';

export interface View {
  group: Group;
  day: DayLetter;
}

/** What the page shows before anything else is chosen. */
export const DEFAULT_VIEW: View = { group: 'legs', day: 'A' };

const DAY_HASH = /^#?(push|pull|legs)([ab])$/i;

/** "#pushB" → Push B (any letter case). Anything else, such as "#sources", → null. */
export function parseDayHash(hash: string): View | null {
  const m = DAY_HASH.exec(hash);
  return m ? { group: m[1].toLowerCase() as Group, day: m[2].toUpperCase() as DayLetter } : null;
}

/** Push B → "#pushB". */
export const dayHash = (view: View): string => `#${view.group}${view.day}`;

/** The browser's address, or a stand-in for tests. */
export interface Address {
  readHash(): string;
  /** Replaces the hash without adding a history entry. */
  replaceHash(hash: string): void;
}

export interface ViewStore {
  get(): View;
  subscribe(listener: () => void): () => void;
  /** Shows a day. Choosing what's already shown changes nothing. */
  show(group: Group, day: DayLetter): void;
  /** Another group, same day letter. */
  showGroup(group: Group): void;
  /** Another day letter, same group. */
  showDay(day: DayLetter): void;
  /** Puts the shown day in the address, as the page always has on load. */
  writeAddress(): void;
  /** After the address changed (hashchange): shows that day. Other anchors are ignored. */
  followAddress(): void;
}

export function createViewStore(address: Address): ViewStore {
  let view = parseDayHash(address.readHash()) ?? DEFAULT_VIEW;
  const listeners = new Set<() => void>();

  const store: ViewStore = {
    get: () => view,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    show(group, day) {
      if (group === view.group && day === view.day) return;
      view = { group, day };
      address.replaceHash(dayHash(view));
      for (const listener of [...listeners]) listener();
    },
    showGroup: (group) => store.show(group, view.day),
    showDay: (day) => store.show(view.group, day),
    writeAddress: () => address.replaceHash(dayHash(view)),
    followAddress() {
      const next = parseDayHash(address.readHash());
      if (next) store.show(next.group, next.day);
    },
  };
  return store;
}

const browserAddress: Address = {
  readHash: () => window.location.hash,
  replaceHash: (hash) => {
    try {
      history.replaceState(null, '', hash);
    } catch {
      /* some embedded browsers refuse; the day still changes */
    }
  },
};

/** The page's one store. On the server it always reports DEFAULT_VIEW. */
export const viewStore: ViewStore =
  typeof window === 'undefined' ? createViewStore({ readHash: () => '', replaceHash: () => {} }) : createViewStore(browserAddress);

const serverView = () => DEFAULT_VIEW;

/**
 * The shown day, for components. The server HTML (and hydration) always use
 * DEFAULT_VIEW, so it matches; a "#pushB" address shows right after.
 */
export function useView(): View {
  return useSyncExternalStore(viewStore.subscribe, viewStore.get, serverView);
}
