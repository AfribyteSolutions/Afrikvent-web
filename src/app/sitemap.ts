import type { MetadataRoute } from 'next';

const base = (process.env.NEXT_PUBLIC_APP_URL && /^https?:\/\//i.test(process.env.NEXT_PUBLIC_APP_URL))
  ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  : 'https://mwakwa.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/events`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
