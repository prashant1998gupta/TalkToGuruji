import { db } from '@/lib/db';
import { SIGNS } from '@/lib/zodiac';
import { HOROSCOPE_FIELDS } from '@/components/admin/entities';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';

export const PUT = adminRoute(async (_admin, req: Request) => {
  const b = await body(req);
  const date = String(b.date || '');
  const sign = String(b.sign || '').toLowerCase();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new HttpError(400, 'Pick a valid date.');
  if (!SIGNS.some((s) => s.slug === sign)) throw new HttpError(400, 'Pick a zodiac sign.');
  const src = (b.data || {}) as Record<string, unknown>;
  const data = JSON.stringify(Object.fromEntries(HOROSCOPE_FIELDS.map((f) => [f, String(src[f] ?? '').trim()])));
  await db.dailyHoroscope.upsert({ where: { date_sign: { date, sign } }, update: { data }, create: { date, sign, data } });
  return Response.json({ ok: true });
});

export const DELETE = adminRoute(async (_admin, req: Request) => {
  const u = new URL(req.url);
  await db.dailyHoroscope.delete({ where: { date_sign: { date: u.searchParams.get('date') || '', sign: u.searchParams.get('sign') || '' } } });
  return Response.json({ ok: true });
});
