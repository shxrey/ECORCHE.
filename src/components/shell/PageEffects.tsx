'use client';

import { useEffect } from 'react';
import { useView, viewStore } from '@/lib/view';
import { reveal } from './reveal';

/** In-page links ("#sources") glide to their section, and the address keeps showing the day. */
function glideToAnchor(e: MouseEvent) {
  const link = (e.target as Element | null)?.closest?.('a[href^="#"]');
  if (!link) return;
  e.preventDefault();
  let target: Element | null = null;
  try {
    target = document.querySelector(link.getAttribute('href') ?? '');
  } catch {
    return; // "#" alone, or not a valid selector
  }
  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Page-wide behaviour, with nothing to draw:
 * - the colour theme follows the shown group (body[data-group]);
 * - the address shows the day ("#legsA" is written on load) and typing or
 *   pasting another day's address switches to it;
 * - sections fade in as they scroll into view;
 * - in-page links scroll smoothly instead of jumping.
 */
export function PageEffects() {
  const { group } = useView();

  useEffect(() => {
    document.body.dataset.group = group;
  }, [group]);

  useEffect(() => {
    viewStore.writeAddress();
    window.addEventListener('hashchange', viewStore.followAddress);
    reveal.watchAll();
    document.addEventListener('click', glideToAnchor);
    return () => {
      window.removeEventListener('hashchange', viewStore.followAddress);
      document.removeEventListener('click', glideToAnchor);
    };
  }, []);

  return null;
}
