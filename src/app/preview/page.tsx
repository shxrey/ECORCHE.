import type { Metadata } from 'next';
import '@/styles/auth.css';
import { AccountNav } from '@/components/auth/AccountNav';
import { Overlays } from '@/components/overlays/Overlays';
import { Anatomy } from '@/components/sections/Anatomy';
import { Gauge } from '@/components/sections/Gauge';
import { Protocol } from '@/components/sections/Protocol';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { Sources } from '@/components/sections/Sources';
import { Standards } from '@/components/sections/Standards';
import { Volume } from '@/components/sections/Volume';
import { Hero } from '@/components/shell/Hero';
import { PageEffects } from '@/components/shell/PageEffects';
import { TopNav } from '@/components/shell/TopNav';
import { CloudSync } from '@/components/sync/CloudSync';
import { Tracker } from '@/components/training/Tracker';
import { TrainingMinibar } from '@/components/training/TrainingMinibar';
import { TrainingRuntime } from '@/components/training/TrainingRuntime';
import { TrainingWorkout } from '@/components/training/TrainingWorkout';
import { WorkoutRuntime } from '@/components/training/WorkoutRuntime';

// Hidden: not in the sitemap, not crawled (robots.ts), not indexed.
export const metadata: Metadata = {
  title: 'Preview · ÉCORCHÉ',
  robots: { index: false, follow: false },
};

/**
 * The rebuilt training core (docs/react-rebuild-plan.md, Phase 3), on the
 * same saved data as the live page, which keeps running the old script until
 * this is complete and "/" switches over. Same page, same look; the tracker,
 * the workout and the session bar run on the training store here, and the old
 * script doesn't load at all, so the two never write the data at once.
 *
 * Still to come: history, export and import (3d).
 */
export default function Preview() {
  return (
    <>
      <TopNav />
      <TrainingMinibar />
      <Hero />
      <Tracker />
      <Protocol />
      <Standards />
      <Gauge />
      <Volume liveCounts />
      <TrainingWorkout />
      <Anatomy />
      <Sources />
      <SiteFooter />
      <Overlays />
      <div className="preview-badge" title="The rebuilt training core, still in progress. Use ecorche.app for real workouts.">
        Preview
      </div>
      <PageEffects />
      <TrainingRuntime />
      <WorkoutRuntime />
      <AccountNav />
      <CloudSync source="store" />
    </>
  );
}
