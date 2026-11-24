'use client';

import { useEffect } from 'react';
import { showToast } from '@/components/overlays/feedback';
import { onTrainingWriteError, trainingStore, useTraining } from '@/lib/training/client';
import type { TrainingStore } from '@/lib/training/store';

declare global {
  interface Window {
    /** The training store, for the behaviour tests (e2e/helpers.ts). */
    __training?: TrainingStore;
  }
}

/**
 * Keeps the rebuilt training core's data safe, drawing nothing:
 * - saves at once when the page is hidden or closed (saves are otherwise
 *   half a second after the last change);
 * - picks up a save made in another tab;
 * - warns once if the browser's storage is full;
 * - applies the high-contrast preference to the page.
 */
export function TrainingRuntime() {
  const highContrast = useTraining((s) => s.prefs.highContrast);

  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    const store = trainingStore();
    window.__training = store;
    const flushIfHidden = () => {
      if (document.visibilityState === 'hidden') store.flush();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea === localStorage && (e.key === null || e.key.startsWith('hb_'))) store.reload();
    };
    let warned = false;
    const stopErrors = onTrainingWriteError((error) => {
      const name = (error as { name?: string } | null)?.name;
      if (warned || (name !== 'QuotaExceededError' && name !== 'NS_ERROR_DOM_QUOTA_REACHED')) return;
      warned = true;
      showToast('Storage full — export your data now (Export Backup, below) to avoid losing progress.');
    });
    document.addEventListener('visibilitychange', flushIfHidden);
    window.addEventListener('pagehide', store.flush);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('visibilitychange', flushIfHidden);
      window.removeEventListener('pagehide', store.flush);
      window.removeEventListener('storage', onStorage);
      stopErrors();
    };
  }, []);

  return null;
}
