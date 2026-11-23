import { cacheLife } from 'next/cache';

/**
 * Brand assets for generated images (tab icon, home-screen icon, link
 * preview card). They're drawn with next/og at build time, so there are no
 * image files to keep in sync with the logo.
 */

export const BRAND = {
  bg: '#0A0B08',
  card: '#181A15',
  ink: '#F4F5F0',
  inkMuted: '#969C8C',
  moss: '#369973',
  mossBright: '#6FC9A4',
} as const;

/**
 * Anton, the logo typeface, as a TTF for next/og. Fetched from Google Fonts
 * once per build; if that fails, the images fall back to the default font
 * instead of failing the deploy.
 */
export async function loadAnton(): Promise<{ name: string; data: ArrayBuffer; weight: 400; style: 'normal' }[]> {
  'use cache'; // fetch once at build time; lets the icons and share card be prerendered
  cacheLife('max');
  try {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Anton')).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return [];
    const res = await fetch(url);
    if (!res.ok) return [];
    return [{ name: 'Anton', data: await res.arrayBuffer(), weight: 400, style: 'normal' }];
  } catch {
    return [];
  }
}

/** The logo mark: "É" with the green full stop, as in the nav logo. */
export function Mark({ size, rounded }: { size: number; rounded: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND.bg,
        borderRadius: rounded ? size * 0.22 : 0,
        fontFamily: 'Anton',
        fontSize: size * 0.7,
        lineHeight: 1,
        color: BRAND.ink,
        paddingTop: size * 0.06,
      }}
    >
      É<span style={{ color: BRAND.moss }}>.</span>
    </div>
  );
}
