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

// One address for search engines, even when reached via the old vercel.app domain.
export const metadata: Metadata = { alternates: { canonical: '/' } };

/**
 * The long-scroll blueprint, in the original order. The tracker, the
 * workout, the session bar and the pop-ups run on the training store
 * (src/lib/training); the old script no longer loads (switched over
 * 25 Nov 2026, docs/react-rebuild-plan.md). The server HTML is still the
 * original page's, and so is the saved data's format.
 */
export default function Home() {
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
      <PageEffects />
      <TrainingRuntime />
      <WorkoutRuntime />
      <AccountNav />
      <CloudSync source="store" />
    </>
  );
}
