'use client';

import { useSyncExternalStore } from 'react';
import { groupIntros, HERO_GROUPS, PROGRAM_SUMMARY } from '@/content/groups';
import type { DayLetter } from '@/content/types';
import { useHydrated } from '@/lib/useHydrated';
import { useView, viewStore } from '@/lib/view';

/**
 * The top of the page: Push / Pull / Legs tabs, the chosen group's heading,
 * description and numbers, and the Day A / B switch. Choosing a group or day
 * shows that day everywhere (see src/lib/view.ts).
 *
 * The server HTML is exactly the original page's: Legs A, with a description
 * of the whole program. Once live it describes the shown group, and an
 * address such as "#pushB" switches straight to Push B.
 *
 * Workout Mode hides the hero by adding classes to it; React leaves those
 * alone because the section's own class never changes.
 */
export function Hero() {
  const view = useView();
  const hydrated = useHydrated();
  const intro = groupIntros[view.group];

  const pickDay = (day: DayLetter) => {
    // A small buzz on phones, as before.
    if (navigator.vibrate) navigator.vibrate(15);
    viewStore.showDay(day);
  };

  return (
    <section className="hero">
      <div className="hero-bg" />
      <div className="hero-grid" />
      <HeroParticles />
      <div className="hero-content">
        <div className="hero-badge" id="heroBadge">
          Science-Backed Protocol
        </div>
        {/* Badge and tabs share a line on wide screens; this is the space between them. */}{' '}
        <div className="group-tabs" id="groupTabs">
          {HERO_GROUPS.map((g) => (
            <button key={g} className={g === view.group ? 'group-tab active' : 'group-tab'} data-tab-group={g} onClick={() => viewStore.showGroup(g)}>
              {groupIntros[g].label}
            </button>
          ))}
        </div>

        <h1 id="heroTitle">
          {intro.title}
          <br />
          <span className="accent" id="heroAccent">
            PROTOCOL
          </span>
        </h1>
        <p className="hero-subtitle" id="heroSubtitle">
          {hydrated ? intro.summary : PROGRAM_SUMMARY}
        </p>

        <div className="day-toggle">
          {(['A', 'B'] as const).map((d) => (
            <button key={d} className={d === view.day ? 'day-toggle-btn active' : 'day-toggle-btn'} onClick={() => pickDay(d)} id={`btnDay${d}`}>
              Day {d}
            </button>
          ))}
        </div>

        <div className="hero-stats" id="heroStats">
          <HeroStat id="statEx" value={intro.exercises} label="Exercises" />
          <HeroStat id="statSets" value={intro.sets} label="Working Sets" />
          <HeroStat id="statMuscles" value={intro.muscles} label="Muscle Groups" />
          <HeroStat id="statMin" value={intro.minutes} label="Minutes" />
        </div>
      </div>
      <div className="scroll-cue">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </section>
  );
}

function HeroStat({ id, value, label }: { id: string; value: number | string; label: string }) {
  return (
    <div className="hero-stat">
      <div className="num" id={id}>
        {value}
      </div>
      <div className="lbl">{label}</div>
    </div>
  );
}

// ---------- ambient particles ----------

/** 18 specks drifting up at random positions and speeds, new on every page load. */
const PARTICLES = Array.from({ length: 18 }, () => ({
  left: `${Math.random() * 100}%`,
  animationDuration: `${6 + Math.random() * 6}s`,
  animationDelay: `${Math.random() * 8}s`,
  opacity: 0.3 + Math.random() * 0.4,
}));

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}
/** Reduced motion asked for (true on the server, so no particles are drawn there). */
function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => true);
}

/** Drawn only once the page is live, and never for visitors who ask for reduced motion. */
function HeroParticles() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="hero-particles" id="heroParticles">
      {reduced ? null : PARTICLES.map((style, i) => <div key={i} className="hero-particle" style={style} />)}
    </div>
  );
}
