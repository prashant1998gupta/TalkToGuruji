import { db } from '@/lib/db';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';
import { astroData } from '@/components/admin/astro-fields';

/** Create an approved astrologer directly (with a login on the given phone). */
export const POST = adminRoute(async (_admin, req: Request) => {
  const b = await body(req);
  const phone = String(b.phone || '').trim();
  if (!/^[6-9]\d{9}$/.test(phone)) throw new HttpError(400, 'Enter a valid 10-digit mobile number.');
  const data = astroData(b);
  if (!data.displayName) throw new HttpError(400, 'Display name is required.');

  let user = await db.user.findUnique({ where: { phone }, include: { astrologer: true } });
  if (user?.astrologer) throw new HttpError(409, 'This phone already has an astrologer profile.');
  if (user?.role === 'ADMIN') throw new HttpError(400, 'Admin accounts cannot be astrologers.');
  if (!user) user = await db.user.create({ data: { phone, name: String(data.displayName) }, include: { astrologer: true } });

  const astro = await db.astrologer.create({
    data: { ...(data as object), userId: user.id, displayName: String(data.displayName), slug: String(data.slug), status: 'APPROVED' },
  });
  await db.user.update({ where: { id: user.id }, data: { role: 'ASTROLOGER' } });
  return Response.json({ ok: true, id: astro.id });
});
