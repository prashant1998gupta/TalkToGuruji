/** Horoscope data access: daily rows (DailyHoroscope) + weekly/monthly/yearly editorial content. */
import { db } from '@/lib/db';
import { json } from '@/lib/format';

export const PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export type Period = (typeof PERIODS)[number];
export const isPeriod = (p: string): p is Period => (PERIODS as readonly string[]).includes(p);

export const DAILY_FIELDS = [
  { key: 'personal', label: 'Personal life' },
  { key: 'profession', label: 'Career & profession' },
  { key: 'love', label: 'Love & relationships' },
  { key: 'luck', label: 'Money & luck' },
  { key: 'health', label: 'Health' },
  { key: 'emotions', label: 'Emotions' },
  { key: 'travel', label: 'Travel' },
] as const;

export type DailyData = Partial<Record<(typeof DAILY_FIELDS)[number]['key'], string>>;

export async function latestDaily() {
  const latest = await db.dailyHoroscope.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
  if (!latest) return { date: null as string | null, bySign: {} as Record<string, DailyData> };
  const rows = await db.dailyHoroscope.findMany({ where: { date: latest.date } });
  return { date: latest.date, bySign: Object.fromEntries(rows.map((r) => [r.sign, json<DailyData>(r.data, {})])) };
}

type Extra = { sign: string; period: string; month?: string | null; year?: string | null; start?: string | null; end?: string | null };

/** Latest editorial horoscope per sign for a period. */
export async function latestPeriodic(period: Exclude<Period, 'daily'>) {
  const rows = await db.content.findMany({ where: { type: 'horoscope', category: period, published: true }, orderBy: { createdAt: 'desc' } });
  const bySign: Record<string, { body: string; excerpt: string | null; label: string; updatedAt: Date }> = {};
  for (const r of rows) {
    const e = json<Extra>(r.extra, { sign: '', period });
    if (!e.sign || bySign[e.sign]) continue;
    const label = period === 'yearly' ? (e.year ? `Year ${e.year}` : '') : period === 'monthly' ? [e.month, e.year].filter(Boolean).join(' ') : e.start && e.end ? `${niceDate(e.start)} – ${niceDate(e.end)}` : '';
    bySign[e.sign] = { body: r.body, excerpt: r.excerpt, label, updatedAt: r.updatedAt };
  }
  return bySign;
}

const niceDate = (s: string) => {
  const d = new Date(s.length === 10 ? `${s}T12:00:00Z` : s);
  return isNaN(+d) ? s : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
};

export const firstSentence = (s?: string | null, n = 150) => {
  const t = (s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).replace(/\s\S*$/, '') + '…' : t;
};
