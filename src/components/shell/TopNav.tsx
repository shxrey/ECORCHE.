'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { FEEDBACK_HREF } from '@/lib/feedback';

const LINKS: [href: string, label: string][] = [
  ['#tracker', 'Tracker'],
  ['#protocol', 'Protocol'],
  ['#standards', 'Standards'],
  ['#gauge', 'Intensity'],
  ['#volume', 'Volume'],
  ['#workout', 'Workout'],
  ['#anatomy', 'Anatomy'],
  ['#sources', 'Sources'],
];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** What Tab can reach in the menu, in order. Includes the account link AccountNav adds after load. */
function focusableIn(menu: HTMLElement | null): HTMLElement[] {
  if (!menu) return [];
  return Array.from(menu.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
}

/**
 * The fixed top bar (logo, section links, the phone menu button) and the phone
 * menu. Links scroll smoothly (PageEffects). While the menu is open the page
 * can't scroll, Tab stays inside the menu, and Escape or any link closes it,
 * handing focus back to the button that opened it.
 *
 * AccountNav adds the account pill to the links, the bar and the menu after
 * load. These elements never re-order their children, so that's safe. Workout
 * Mode hides the bar by adding classes to it, which React leaves alone since
 * the bar's own class never changes.
 */
export function TopNav() {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  // Side effects happen right away, as the old page did, so a menu link's
  // smooth scroll starts with the page already unlocked.
  function setMenu(next: boolean) {
    setOpen(next);
    document.body.style.overflow = next ? 'hidden' : '';
    if (next) {
      returnFocus.current = document.activeElement as HTMLElement | null;
      focusableIn(menu.current)[0]?.focus();
    } else if (returnFocus.current) {
      returnFocus.current.focus();
      returnFocus.current = null;
    }
  }
  // Read by the key listener below without re-subscribing it.
  const setMenuRef = useRef(setMenu);
  useEffect(() => {
    setMenuRef.current = setMenu;
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuRef.current(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusableIn(menu.current);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <nav className="top-nav">
        <div className="nav-logo">
          ÉCORCHÉ<span>.</span>
        </div>
        <div className="nav-links">
          {LINKS.map(([href, label], i) => (
            // The original page had a space between links (a flex row ignores it).
            <Fragment key={href}>
              {i > 0 && ' '}
              <a href={href}>{label}</a>
            </Fragment>
          ))}
        </div>
        <button
          className={open ? 'hamburger-btn open' : 'hamburger-btn'}
          id="hamburgerBtn"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setMenu(!open)}
        >
          <span />
        </button>
      </nav>

      <div ref={menu} className={open ? 'mobile-drawer open' : 'mobile-drawer'} id="mobileDrawer" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <button className="mobile-drawer-close" onClick={() => setMenu(false)} aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {LINKS.map(([href, label]) => (
          <Fragment key={href}>
            {' '}
            <a href={href} onClick={() => setMenu(false)}>
              {label}
            </a>
          </Fragment>
        ))}{' '}
        {/* Details are filled in on click by FeedbackLinks; styled in src/styles/overrides.css. */}
        <a href={FEEDBACK_HREF} className="drawer-feedback" data-feedback="" onClick={() => setMenu(false)}>
          Send feedback
        </a>
      </div>
    </>
  );
}
