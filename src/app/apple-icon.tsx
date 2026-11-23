import { ImageResponse } from 'next/og';
import { loadAnton, Mark } from '@/lib/brand';

// Home-screen icon for iPhone/iPad ("Add to Home Screen"). Square: iOS rounds the corners itself.
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  return new ImageResponse(<Mark size={size.width} rounded={false} />, { ...size, fonts: await loadAnton() });
}
