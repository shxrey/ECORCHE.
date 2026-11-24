import type { Metadata, Viewport } from 'next';
import { Anton, Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import '@/styles/protocol.css';
import '@/styles/overrides.css';
import { SITE_URL } from '@/lib/site';

// Self-hosted at build time (no Google Fonts request, no layout shift).
// protocol.css reads these through --font-display / --font-body / --font-mono.
const anton = Anton({ weight: '400', subsets: ['latin'], variable: '--nf-anton', display: 'swap' });
const inter = Inter({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--nf-inter',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--nf-jetbrains',
  display: 'swap',
});

const title = 'ÉCORCHÉ — Push / Pull / Legs Hypertrophy Protocol';
const description =
  'An evidence-based 6-day Push / Pull / Legs A-B split: 46 exercises, 132 weekly working sets, built on the hypertrophy research of Schoenfeld, Helms, Maeo and Nippard.';

export const metadata: Metadata = {
  // Absolute URLs for share cards and canonical links always use the real domain.
  metadataBase: new URL(SITE_URL),
  title,
  applicationName: 'ÉCORCHÉ',
  description,
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'ÉCORCHÉ' },
  // The share image comes from src/app/opengraph-image.tsx.
  openGraph: { type: 'website', siteName: 'ÉCORCHÉ', title, description, url: '/' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0A0B08',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${anton.variable} ${inter.variable} ${jetbrains.variable}`} suppressHydrationWarning>
      {/* The legacy runtime mutates body classes/attributes after hydration. */}
      <body data-group="legs" suppressHydrationWarning>
        {children}
        {/* Anonymous, cookie-free visit counts (Vercel Web Analytics); described on /privacy. */}
        <Analytics />
      </body>
    </html>
  );
}
