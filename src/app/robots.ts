import type { MetadataRoute } from 'next';

const base = (process.env.NEXT_PUBLIC_APP_URL && /^https?:\/\//i.test(process.env.NEXT_PUBLIC_APP_URL))
  ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  : 'https://mwakwa.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/organiser', '/profile', '/payment-success', '/auth/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
