import type { Metadata } from 'next';
import '@/styles/auth.css';
import { AccountNav } from '@/components/auth/AccountNav';
import { LegacyFragment } from '@/components/legacy/LegacyFragment';
import { LegacyRuntime } from '@/components/legacy/LegacyRuntime';
import { Anatomy } from '@/components/sections/Anatomy';
import { Gauge } from '@/components/sections/Gauge';
import { Protocol } from '@/components/sections/Protocol';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { Sources } from '@/components/sections/Sources';
import { Standards } from '@/components/sections/Standards';
import { Volume } from '@/components/sections/Volume';
import { Hero } from '@/components/shell/Hero';
import { PageEffects } from '@/components/shell/PageEffects';
import { SessionMinibar } from '@/components/shell/SessionMinibar';
import { TopNav } from '@/components/shell/TopNav';
import { CloudSync } from '@/components/sync/CloudSync';
import { Workout } from '@/components/workout/Workout';

// One address for search engines, even when reached via the old vercel.app domain.
export const metadata: Metadata = { alternates: { canonical: '/' } };

/**
 * The long-scroll blueprint, in the original order. Sections still rendered
 * from LegacyFragment (the tracker, the pop-ups) move to React with the
 * training core (docs/react-rebuild-plan.md, Phase 3).
 */
export default function Home() {
  return (
    <>
      <TopNav />
      <SessionMinibar />
      <Hero />
      <LegacyFragment name="tracker" />
      <Protocol />
      <Standards />
      <Gauge />
      <Volume />
      <Workout />
      <Anatomy />
      <Sources />
      <SiteFooter />
      <LegacyFragment name="overlays" />
      <PageEffects />
      <LegacyRuntime />
      <AccountNav />
      <CloudSync />
    </>
  );
}
