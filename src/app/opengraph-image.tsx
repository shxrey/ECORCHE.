import { ImageResponse } from 'next/og';
import { BRAND, loadAnton } from '@/lib/brand';

// The preview card shown when ecorche.app is shared (WhatsApp, Instagram, X, Discord, iMessage…).
export const alt = 'ÉCORCHÉ: a science-backed 6-day Push / Pull / Legs hypertrophy protocol';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px 88px 64px',
          background: `radial-gradient(ellipse 70% 60% at 15% 0%, rgba(54,153,115,0.22), transparent 70%), ${BRAND.bg}`,
          color: BRAND.ink,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 26, letterSpacing: 6, color: BRAND.mossBright }}>
          <div style={{ width: 56, height: 2, background: BRAND.mossBright }} />
          SCIENCE-BACKED PROTOCOL
        </div>
        <div style={{ display: 'flex', fontFamily: 'Anton', fontSize: 210, lineHeight: 1.05, marginTop: 18 }}>
          ÉCORCHÉ<span style={{ color: BRAND.moss }}>.</span>
        </div>
        <div style={{ display: 'flex', fontSize: 38, color: BRAND.inkMuted, marginTop: 18 }}>
          6-day Push / Pull / Legs · 46 exercises · 132 weekly sets
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: BRAND.ink, marginTop: 44 }}>
          Track every set, PR and note. Synced across your devices.
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: BRAND.mossBright, marginTop: 40 }}>ecorche.app</div>
      </div>
    ),
    { ...size, fonts: await loadAnton() },
  );
}
