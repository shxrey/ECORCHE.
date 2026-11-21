import type { Metadata, Viewport } from 'next';
import { Anton, Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/protocol.css';

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

export const metadata: Metadata = {
  title: "Shrey's Hypertrophy Blueprint — Push / Pull / Legs Protocol",
  description:
    'An evidence-based 6-day Push / Pull / Legs A-B split: 46 exercises, 132 weekly working sets, built on the hypertrophy research of Schoenfeld, Helms, Maeo and Nippard.',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Hypertrophy' },
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
      </body>
    </html>
  );
}
