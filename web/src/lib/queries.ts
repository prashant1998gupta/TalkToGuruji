import { db } from './db';
import type { AstroCardData } from '@/components/consult/AstrologerCard';

export const astroCardSelect = {
  id: true, slug: true, displayName: true, avatar: true, skills: true, languages: true, experience: true, chatPrice: true, callPrice: true,
  videoPrice: true, isChat: true, isCall: true, isVideo: true, rating: true, ratingCount: true, totalMinutes: true, freeMinutes: true,
  featured: true, isOnline: true, isBusy: true,
} as const;

export async function approvedAstrologers(where: Record<string, unknown> = {}) {
  const rows = await db.astrologer.findMany({ where: { status: 'APPROVED', ...where }, select: astroCardSelect, orderBy: [{ isOnline: 'desc' }, { featured: 'desc' }, { rating: 'desc' }] });
  const statuses = Object.fromEntries(rows.map((r) => [r.id, { isOnline: r.isOnline, isBusy: r.isBusy }]));
  const cards: AstroCardData[] = rows.map(({ isOnline, isBusy, ...r }) => r); // eslint-disable-line @typescript-eslint/no-unused-vars
  return { cards, statuses };
}
