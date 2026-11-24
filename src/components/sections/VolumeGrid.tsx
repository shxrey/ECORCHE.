'use client';

import { useEffect, useRef, useState } from 'react';
import type { VolumeCard } from '@/content/volume';
import { useToday, useTraining } from '@/lib/training/client';
import { volumeLine } from '@/lib/training/volume';
import { useHydrated } from '@/lib/useHydrated';

/** "12 logged so far · last trained yesterday", from the training store (rebuilt core only). */
function VolumeLine({ muscle }: { muscle: string }) {
  const doneMap = useTraining((s) => s.doneMap);
  const logMap = useTraining((s) => s.logMap);
  const today = useToday();
  const line = today ? volumeLine(muscle, doneMap, logMap, today) : null;
  return line === null ? null : <div className="volume-completed">{line}</div>;
}

const DETAIL_STYLE = { fontWeight: 500, color: 'var(--ink-muted)', fontSize: '12px' };
const ZONE_STYLE = { left: '41.67%', width: '41.67%' };

/**
 * The 14 muscle cards. Each bar starts empty once the page is live and grows
 * to its share when the card scrolls into view. (The server HTML shows full
 * bars, for search engines and readers without JavaScript.) Tapping a card
 * highlights it and the shown day's exercises for that muscle.
 *
 * Each card's "N logged so far · last trained …" line needs the training
 * data: with `liveCounts` (the rebuilt training core, /preview) it comes from
 * the training store; otherwise public/legacy/protocol.js adds it, and React
 * never adds or removes a card's children, so that line is left alone.
 */
export function VolumeGrid({ cards, liveCounts = false }: { cards: VolumeCard[]; liveCounts?: boolean }) {
  const hydrated = useHydrated();
  const [grown, setGrown] = useState<ReadonlySet<string>>(() => new Set());
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const muscle = (entry.target as HTMLElement).dataset.muscle ?? '';
          setGrown((prev) => new Set(prev).add(muscle));
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 },
    );
    grid.current?.querySelectorAll('.volume-card').forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="volume-grid reveal" ref={grid}>
      {cards.map((card) => (
        <div
          key={card.muscle}
          className={highlighted === card.muscle ? 'volume-card pulse-highlight' : 'volume-card'}
          data-muscle={card.muscle}
          onClick={() => {
            setHighlighted(card.muscle);
            glowExercisesFor(card.muscle);
          }}
        >
          <div className="volume-card-top">
            <h4>
              {card.muscle}
              {card.detail ? (
                <>
                  {' '}
                  <span style={DETAIL_STYLE}>{card.detail}</span>
                </>
              ) : null}
            </h4>
            <span className={`volume-verdict verdict-${card.verdict.tone}`}>{card.verdict.label}</span>
          </div>
          <div className="volume-number" style={{ color: card.color }}>
            {card.sets}
            <span>sets / wk</span>
          </div>
          {liveCounts ? <VolumeLine muscle={card.muscle} /> : null}
          <div className="volume-track">
            <div className="volume-zone" style={ZONE_STYLE} />
            <div
              className="volume-fill"
              style={{ transform: `scaleX(${!hydrated || grown.has(card.muscle) ? card.scale : 0})`, background: card.fill }}
            />
          </div>
          <p className="volume-note">{card.note}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Briefly glows the exercise cards on the shown day whose muscle tags match
 * `muscle`, and scrolls to the first. The workout is still drawn and switched
 * by the old script, so this works on its DOM, exactly as the old code did.
 */
function glowExercisesFor(muscle: string) {
  const name = muscle.toLowerCase();
  const day = document.querySelector('.day-content.active');
  if (!day) return;
  const matches = Array.from(day.querySelectorAll<HTMLElement>('.exercise-card')).filter((card) =>
    Array.from(card.querySelectorAll('.muscle-tag')).some((tag) => {
      const text = (tag.textContent ?? '').toLowerCase();
      return text.includes(name.split(' ')[0]) || name.includes(text.split(' ')[0]);
    }),
  );
  for (const card of matches) {
    card.style.animation = 'none';
    void card.offsetWidth;
    card.style.boxShadow = 'var(--shadow-3), 0 0 40px -6px var(--accent-glow)';
    setTimeout(() => {
      card.style.boxShadow = '';
    }, 1400);
  }
  matches[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
