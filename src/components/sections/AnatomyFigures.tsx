import type { ReactNode } from 'react';
import type { Group } from '@/content/types';

/**
 * The Anatomy section's drawings: a body diagram per training group (shaded
 * zones match the colour key beside it) and the small three-heads diagram on
 * the triceps and biceps cards.
 */
export const BODY_FIGURES: Record<Group, ReactNode> = {
  push: (
    <svg viewBox="0 0 400 420" className="silhouette-svg">
      {/* base figure */}
      <circle className="sil-base" cx="200" cy="55" r="30" />
      <rect className="sil-base" x="186" y="80" width="28" height="20" rx="6" />
      <path className="sil-base" d="M130,100 C130,94 270,94 270,100 L258,270 C256,300 144,300 142,270 Z" />
      <rect className="sil-base" x="68" y="108" width="46" height="185" rx="23" />
      <rect className="sil-base" x="286" y="108" width="46" height="185" rx="23" />
      {/* upper chest */}
      <ellipse className="sil-zone zone-chest-upper" cx="200" cy="140" rx="62" ry="24" />
      {/* lower chest */}
      <ellipse className="sil-zone zone-chest-lower" cx="200" cy="188" rx="58" ry="28" />
      {/* delts */}
      <circle className="sil-zone zone-delt" cx="98" cy="120" r="27" />
      <circle className="sil-zone zone-delt" cx="302" cy="120" r="27" />
      {/* abs */}
      <rect className="sil-zone zone-abs" x="172" y="264" width="56" height="82" rx="16" />
      <line className="zone-line" x1="172" y1="292" x2="228" y2="292" />
      <line className="zone-line" x1="172" y1="318" x2="228" y2="318" />
      <line className="zone-line" x1="200" y1="264" x2="200" y2="346" />
    </svg>
  ),
  pull: (
    <svg viewBox="0 0 400 420" className="silhouette-svg">
      {/* base figure, back view */}
      <circle className="sil-base" cx="200" cy="52" r="28" />
      <rect className="sil-base" x="188" y="76" width="24" height="18" rx="5" />
      <path className="sil-base" d="M138,92 C138,86 262,86 262,92 L246,270 C244,300 156,300 154,270 Z" />
      <rect className="sil-base" x="62" y="100" width="44" height="190" rx="22" />
      <rect className="sil-base" x="294" y="100" width="44" height="190" rx="22" />
      {/* traps */}
      <polygon className="sil-zone zone-traps" points="200,96 244,132 200,158 156,132" />
      {/* lats (fan out from spine) */}
      <ellipse className="sil-zone zone-lats" cx="150" cy="200" rx="40" ry="70" />
      <ellipse className="sil-zone zone-lats" cx="250" cy="200" rx="40" ry="70" />
      {/* rear delts */}
      <circle className="sil-zone zone-reardelt" cx="100" cy="112" r="24" />
      <circle className="sil-zone zone-reardelt" cx="300" cy="112" r="24" />
      {/* biceps */}
      <ellipse className="sil-zone zone-bicep" cx="84" cy="168" rx="20" ry="34" />
      <ellipse className="sil-zone zone-bicep" cx="316" cy="168" rx="20" ry="34" />
      {/* forearms */}
      <rect className="sil-zone zone-forearm" x="66" y="210" width="34" height="72" rx="14" />
      <rect className="sil-zone zone-forearm" x="300" y="210" width="34" height="72" rx="14" />
      <line className="zone-line" x1="200" y1="96" x2="200" y2="300" />
    </svg>
  ),
  legs: (
    <svg viewBox="0 0 320 460" className="silhouette-svg">
      {/* base figure: pelvis + two legs */}
      <path className="sil-base" d="M110,30 C110,24 210,24 210,30 L218,130 C220,150 100,150 102,130 Z" />
      <rect className="sil-base" x="98" y="128" width="52" height="230" rx="26" />
      <rect className="sil-base" x="170" y="128" width="52" height="230" rx="26" />
      <ellipse className="sil-base" cx="124" cy="378" rx="30" ry="16" />
      <ellipse className="sil-base" cx="196" cy="378" rx="30" ry="16" />
      {/* glutes */}
      <ellipse className="sil-zone zone-glute" cx="124" cy="105" rx="30" ry="26" />
      <ellipse className="sil-zone zone-glute" cx="196" cy="105" rx="30" ry="26" />
      {/* quads (front of thigh) */}
      <ellipse className="sil-zone zone-quad" cx="124" cy="210" rx="24" ry="62" />
      <ellipse className="sil-zone zone-quad" cx="196" cy="210" rx="24" ry="62" />
      {/* hamstrings (back of thigh, offset) */}
      <ellipse className="sil-zone zone-ham" cx="124" cy="230" rx="16" ry="48" opacity="0.55" />
      <ellipse className="sil-zone zone-ham" cx="196" cy="230" rx="16" ry="48" opacity="0.55" />
      {/* calves */}
      <ellipse className="sil-zone zone-calf" cx="124" cy="325" rx="20" ry="42" />
      <ellipse className="sil-zone zone-calf" cx="196" cy="325" rx="20" ry="42" />
    </svg>
  ),
};

/** Three overlapping heads (long, lateral, medial), coloured by the card's theme. */
export function HeadsDiagram() {
  return (
    <svg viewBox="0 0 200 200" className="tri-head-svg">
      <ellipse className="head-long" cx="100" cy="72" rx="46" ry="36" />
      <ellipse className="head-lateral" cx="66" cy="122" rx="36" ry="30" />
      <ellipse className="head-medial" cx="132" cy="124" rx="30" ry="26" />
    </svg>
  );
}
