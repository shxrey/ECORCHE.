'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __legacyRuntimeLoaded?: boolean;
  }
}

/**
 * Boots the original protocol logic (set tracking, logger, rest timer, kiosk
 * mode, PRs...) once React has finished hydrating, so the legacy DOM work can
 * never collide with hydration. The flag keeps React Strict Mode's double
 * effect run in dev from loading it twice.
 */
export function LegacyRuntime() {
  useEffect(() => {
    if (window.__legacyRuntimeLoaded) return;
    window.__legacyRuntimeLoaded = true;
    const script = document.createElement('script');
    script.src = '/legacy/protocol.js';
    document.body.appendChild(script);
  }, []);
  return null;
}
