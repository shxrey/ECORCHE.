'use client';

import { useState } from 'react';
import type { Study } from '@/content/sources';
import { SourceCard } from './SourceCard';
import { useHydrated } from '@/lib/useHydrated';

const SHOWN = 3;
const HIDDEN = { display: 'none' } as const;

/**
 * A tab's studies. Lists longer than 4 show the first 3 and a "Show N more
 * studies" button once the page is live; the server HTML lists them all, for
 * search engines and readers without JavaScript.
 *
 * Extra cards are hidden with a style, not a class: the old script marks each
 * card's class when it fades in, and React rewriting the class could undo that.
 */
export function StudyList({ studies }: { studies: Study[] }) {
  const hydrated = useHydrated();
  const [expanded, setExpanded] = useState(false);
  const collapsed = hydrated && !expanded && studies.length > SHOWN + 1;
  return (
    <>
      {studies.map((study, i) => (
        <SourceCard key={study.title} study={study} index={i} style={collapsed && i >= SHOWN ? HIDDEN : undefined} />
      ))}
      {collapsed ? (
        <button type="button" className="sources-show-more" onClick={() => setExpanded(true)}>
          {`Show ${studies.length - SHOWN} more studies`}
        </button>
      ) : null}
    </>
  );
}
