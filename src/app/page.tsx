import type { Metadata } from 'next';
import '@/styles/auth.css';
import { AccountNav } from '@/components/auth/AccountNav';
import { LegacyFragment } from '@/components/legacy/LegacyFragment';
import { LegacyRuntime } from '@/components/legacy/LegacyRuntime';
import { Gauge } from '@/components/sections/Gauge';
import { Protocol } from '@/components/sections/Protocol';
import { SiteFooter } from '@/components/sections/SiteFooter';
import { Standards } from '@/components/sections/Standards';
import { Volume } from '@/components/sections/Volume';
import { CloudSync } from '@/components/sync/CloudSync';
import { Workout } from '@/components/workout/Workout';

// One address for search engines, even when reached via the old vercel.app domain.
export const metadata: Metadata = { alternates: { canonical: '/' } };

/**
 * The long-scroll blueprint, in the original order. Sections still rendered
 * from LegacyFragment get ported to React components one at a time.
 */
export default function Home() {
  return (
    <>
      <LegacyFragment name="nav" />
      <LegacyFragment name="hero" />
      <LegacyFragment name="tracker" />
      <Protocol />
      <Standards />
      <Gauge />
      <Volume />
      <Workout />
      <LegacyFragment name="anatomy" />
      <LegacyFragment name="sources" />
      <SiteFooter />
      <LegacyFragment name="overlays" />
      <LegacyRuntime />
      <AccountNav />
      <CloudSync />
    </>
  );
}
