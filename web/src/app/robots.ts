import type { MetadataRoute } from 'next';

const BASE = process.env.SITE_URL || 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/astrologer-panel', '/account', '/api', '/consult', '/pay', '/cart', '/checkout', '/wallet', '/login'] }],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
