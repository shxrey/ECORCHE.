import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// /sitemap.xml: the public pages search engines should know about.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${SITE_URL}/login`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
