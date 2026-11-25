import { useSyncExternalStore } from 'react';

/**
 * A tiny shared value with subscribers, readable from any component with
 * `.use()` (React's useSyncExternalStore). Every reader sees the same value;
 * the server HTML always uses `initial`.
 */
export function createSignal<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };
  const get = () => value;
  const serverValue = () => initial;
  return {
    get,
    set(next: T) {
      if (Object.is(next, value)) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe,
    use(): T {
      return useSyncExternalStore(subscribe, get, serverValue);
    },
  };
}
