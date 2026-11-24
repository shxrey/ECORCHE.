'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import type { Group } from '@/content/types';

const GROUPS: Group[] = ['push', 'pull', 'legs'];

/**
 * Push / Pull / Legs tabs over three panels, one shown at a time, Legs first
 * (Anatomy and Sources). Independent of the day chosen at the top of the page.
 *
 * The panels themselves never fade in (only their contents do), so switching
 * a panel's class can't undo the old script's scroll reveal.
 */
export function GroupTabs({
  id,
  style,
  labels,
  panelClass,
  panels,
}: {
  /** id of the tab row, e.g. "anatomyTabs". */
  id: string;
  style?: CSSProperties;
  labels: Record<Group, string>;
  /** e.g. "anatomy-panel"; the shown one also gets "active". */
  panelClass: string;
  panels: Record<Group, ReactNode>;
}) {
  const [shown, setShown] = useState<Group>('legs');
  return (
    <>
      <div className="group-tabs reveal" id={id} style={style}>
        {GROUPS.map((g) => (
          <button key={g} className={g === shown ? 'group-tab active' : 'group-tab'} data-tab-group={g} onClick={() => setShown(g)}>
            {labels[g]}
          </button>
        ))}
      </div>
      {GROUPS.map((g) => (
        <div key={g} className={g === shown ? `${panelClass} active` : panelClass} data-group={g}>
          {panels[g]}
        </div>
      ))}
    </>
  );
}
