import { useSyncExternalStore } from 'react';

const noSubscription = () => () => {};

/**
 * False in the server HTML and while React takes over the page, true once it's
 * live. Lets a section render exactly the original markup for search engines
 * and readers without JavaScript, then switch on behaviour (empty bars that
 * grow, collapsed study lists) without a hydration mismatch.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noSubscription, () => true, () => false);
}
