import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { hrefFor } from '@/components/content/data';

const BASE = process.env.SITE_URL || 'http://localhost:3000';
export const dynamic = 'force-dynamic';

const STATIC = [
  '', '/astrology-services', '/astrology-services/chat-with-astrologer', '/astrology-services/talk-to-astrologer', '/astrology-services/video-consultation',
  '/astrology-services/live-astrologers', '/astrology-services/free-kundli', '/astrology-services/kundli-matching', '/astrology-services/panchang',
  '/astrology-services/online-pooja-booking', '/astrology-services/online-katha-booking', '/horoscope', '/horoscope/daily', '/horoscope/weekly',
  '/horoscope/monthly', '/horoscope/yearly', '/transits', '/rituals', '/rituals/vrats', '/rituals/festivals', '/rituals/aarti', '/rituals/bhajan',
  '/remedies', '/vastu', '/numerology', '/tarot', '/blogs', '/astrology-news', '/videos', '/web-stories', '/photo-gallery', '/audio-podcast',
  '/live-aarti-darshan', '/live-temple-darshan', '/subscription-plan', '/astro-mart', '/about-us', '/contact-us', '/terms-and-conditions',
  '/privacy-policy', '/refund-policy', '/astrologer-terms-and-condition', '/astro-registration',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [content, pujas, products, cats, astros] = await Promise.all([
    db.content.findMany({ where: { published: true, type: { not: 'horoscope' } }, select: { type: true, slug: true, updatedAt: true } }),
    db.puja.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
    db.product.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
    db.productCategory.findMany({ select: { slug: true } }),
    db.astrologer.findMany({ where: { status: 'APPROVED' }, select: { slug: true, updatedAt: true } }),
  ]);
  const now = new Date();
  return [
    ...STATIC.map((p) => ({ url: `${BASE}${p}`, lastModified: now, changeFrequency: 'daily' as const, priority: p === '' ? 1 : 0.8 })),
    ...content.map((c) => ({ url: `${BASE}${hrefFor(c.type, c.slug)}`, lastModified: c.updatedAt, priority: 0.6 })),
    ...pujas.map((p) => ({ url: `${BASE}/puja/${encodeURIComponent(p.slug)}`, lastModified: p.createdAt, priority: 0.7 })),
    ...cats.map((c) => ({ url: `${BASE}/astro-mart/${c.slug}`, lastModified: now, priority: 0.5 })),
    ...products.map((p) => ({ url: `${BASE}/astro-mart/product/${p.slug}`, lastModified: p.createdAt, priority: 0.6 })),
    ...astros.map((a) => ({ url: `${BASE}/astrologer/${a.slug}`, lastModified: a.updatedAt, priority: 0.7 })),
  ];
}
