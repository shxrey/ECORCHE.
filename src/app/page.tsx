import '@/styles/auth.css';
import { AccountNav } from '@/components/auth/AccountNav';
import { LegacyFragment } from '@/components/legacy/LegacyFragment';
import { LegacyRuntime } from '@/components/legacy/LegacyRuntime';
import { Workout } from '@/components/workout/Workout';

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
      <LegacyFragment name="protocol" />
      <LegacyFragment name="standards" />
      <LegacyFragment name="gauge" />
      <LegacyFragment name="volume" />
      <Workout />
      <LegacyFragment name="anatomy" />
      <LegacyFragment name="sources" />
      <LegacyFragment name="footer" />
      <LegacyFragment name="overlays" />
      <LegacyRuntime />
      <AccountNav />
    </>
  );
}
