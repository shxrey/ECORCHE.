import { ImageResponse } from 'next/og';
import { loadAnton, Mark } from '@/lib/brand';

// Browser tab icon (favicon), generated at build time.
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default async function Icon() {
  return new ImageResponse(<Mark size={size.width} rounded />, { ...size, fonts: await loadAnton() });
}
