import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== 'production';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

/**
 * What the browser may load and do on this site. Everything is served from
 * our own domain; the only outside connection is Supabase (accounts + sync).
 * 'unsafe-inline' scripts stay allowed for now because the original app's
 * markup uses inline onclick handlers; that goes away as sections move to React.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl} ${supabaseUrl.replace(/^https:/, 'wss:')}` : ''}`,
  "media-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-ancestors 'none'", // no other site can embed ÉCORCHÉ (clickjacking)
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' }, // the same, for older browsers
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    // The rebuilt training core was tried out at /preview before "/" switched
    // to it (25 Nov 2026). Temporary, so phones don't remember it for good.
    return [{ source: '/preview', destination: '/', permanent: false }];
  },
};

export default nextConfig;
