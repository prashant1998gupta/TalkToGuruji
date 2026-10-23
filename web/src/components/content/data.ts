import { cache } from 'react';
import { db } from '@/lib/db';

/** Per-type labels and URLs for the editorial sections imported from the old site. */
export const TYPES = {
  blog: { label: 'Blogs', base: '/blogs', eyebrow: 'From Guruji’s desk', intro: 'Welcome to our blog, your guide to astrology, spirituality, and personal growth with insights to enrich your life.' },
  news: { label: 'Astrology News', base: '/astrology-news', eyebrow: 'Cosmic headlines', intro: 'Planetary shifts, eclipses and transits — what the sky is signalling for the world and for you.' },
  remedy: { label: 'Remedies', base: '/remedies', eyebrow: 'Graha upay', intro: 'Simple Vedic remedies for each planet — mantras, fasts, donations and daily practices to strengthen weak grahas and calm malefic ones.' },
  vastu: { label: 'Vastu Shastra', base: '/vastu', eyebrow: 'Vastu', intro: 'Align your home and workplace with the five elements. Practical Vastu tips for health, wealth, love and positive energy.' },
  numerology: { label: 'Numerology', base: '/numerology', eyebrow: 'Ank Jyotish', intro: 'Discover what your birth number reveals about your nature, strengths, career and relationships.' },
  tarot: { label: 'Tarot Cards', base: '/tarot', eyebrow: 'Major Arcana', intro: 'Meanings of the Major Arcana — upright and reversed — for love, career and life guidance.' },
  video: { label: 'Videos', base: '/videos', eyebrow: 'Watch', intro: 'Predictions, remedies and spiritual wisdom from Talk to Guruji.' },
  story: { label: 'Web Stories', base: '/web-stories', eyebrow: 'Swipe through', intro: 'Bite-sized visual stories on rituals, festivals, remedies and numerology.' },
  gallery: { label: 'Photo Gallery', base: '/photo-gallery', eyebrow: 'Darshan', intro: 'Sacred moments, symbols and celebrations captured in pictures.' },
  festival: { label: 'Festivals', base: '/rituals/festivals', eyebrow: 'Utsav', intro: 'Hindu festivals through the year — dates, significance, rituals and how to celebrate.' },
  vrat: { label: 'Vrats', base: '/rituals/vrats', eyebrow: 'Sacred fasts', intro: 'Embrace the spiritual significance of Vrats, a year filled with devotion, fasting, and divine blessings. Whether it’s Ekadashi, Pradosh, Purnima, or other auspicious fasts, each vrat holds a deep-rooted tradition that purifies the mind and soul.' },
  aarti: { label: 'Aarti', base: '/rituals/aarti', eyebrow: 'Devotion', intro: 'Complete lyrics of popular aartis for daily puja and festivals.' },
  bhajan: { label: 'Bhajan', base: '/rituals/bhajan', eyebrow: 'Devotion', intro: 'Soulful bhajans to sing in praise of the divine.' },
} as const;

export type ContentType = keyof typeof TYPES;

export const hrefFor = (type: string, slug: string) => `${TYPES[type as ContentType]?.base ?? '/' + type}/${encodeURIComponent(slug)}`;

const norm = (s: string) => decodeURIComponent(s).toLowerCase().replace(/\s+/g, '').replace(/-\d+$/, '').replace(/-+/g, '-');

/**
 * Find a published item by slug. Old-site slugs mix case, spaces and numeric
 * suffixes (e.g. "moon-remedies-4"), so fall back to a normalised match.
 */
export const findContent = cache(async (type: string, slug: string) => {
  const raw = decodeURIComponent(slug);
  const exact = await db.content.findFirst({ where: { type, slug: raw, published: true } });
  if (exact) return exact;
  const all = await db.content.findMany({ where: { type, published: true }, select: { id: true, slug: true } });
  const hit = all.find((c) => c.slug.toLowerCase() === raw.toLowerCase()) || all.find((c) => norm(c.slug) === norm(raw));
  return hit ? db.content.findUnique({ where: { id: hit.id } }) : null;
});

/** Add ids to h2/h3 so the article can have a table of contents. */
export function withHeadingIds(html: string) {
  const toc: { id: string; text: string; level: number }[] = [];
  const used = new Set<string>();
  const out = html.replace(/<(h[23])>([\s\S]*?)<\/\1>/g, (_, tag: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/g, ' ').trim();
    if (!text) return '';
    let id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'section';
    while (used.has(id)) id += '-x';
    used.add(id);
    toc.push({ id, text, level: tag === 'h2' ? 2 : 3 });
    return `<${tag} id="${id}" class="scroll-mt-28">${inner}</${tag}>`;
  });
  return { html: out, toc };
}

export const plain = (html?: string | null) => (html || '').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();

export const youTubeId = (url?: string | null) => url?.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/)?.[1] ?? null;
