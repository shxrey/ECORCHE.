'use client';

import { useEffect } from 'react';
import { reveal } from '@/components/shell/reveal';
import { viewStore, type ViewStore } from '@/lib/view';

declare global {
  interface Window {
    __legacyRuntimeLoaded?: boolean;
    /** The shown day (src/lib/view.ts), for the old script: it follows it and asks it for changes. */
    __view?: ViewStore;
    /** Scroll reveal (src/components/shell/reveal.ts), for replaying a day's fade-in. */
    __reveal?: typeof reveal;
  }
}

/**
 * Boots the original protocol logic (set tracking, logger, rest timer, kiosk
 * mode, PRs...) once React has finished hydrating, so the legacy DOM work can
 * never collide with hydration. The flag keeps React Strict Mode's double
 * effect run in dev from loading it twice.
 *
 * The React pieces the old script relies on are handed over first.
 */
export function LegacyRuntime() {
  useEffect(() => {
    if (window.__legacyRuntimeLoaded) return;
    window.__legacyRuntimeLoaded = true;
    window.__view = viewStore;
    window.__reveal = reveal;
    const script = document.createElement('script');
    script.src = '/legacy/protocol.js';
    document.body.appendChild(script);
  }, []);
  return null;
}
