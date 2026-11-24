'use client';

import { useEffect } from 'react';
import { feedbackMailto } from '@/lib/feedback';

/** Set by Vercel at build time; absent locally. */
const VERSION = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7);

/**
 * Fills every "Send feedback" link (a[data-feedback], in React pages and in
 * the legacy fragments alike) with the page and device details at the moment
 * it's clicked, so the email reflects where the lifter actually was. Without
 * JavaScript the link still opens a plain email. Renders nothing.
 */
export function FeedbackLinks() {
  useEffect(() => {
    const fill = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest('a[data-feedback]') : null;
      if (!(link instanceof HTMLAnchorElement)) return;
      link.href = feedbackMailto({
        page: location.host + location.pathname + location.hash,
        userAgent: navigator.userAgent,
        width: window.innerWidth,
        version: VERSION,
      });
    };
    document.addEventListener('click', fill, true);
    return () => document.removeEventListener('click', fill, true);
  }, []);
  return null;
}
