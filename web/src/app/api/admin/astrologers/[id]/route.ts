import { db } from '@/lib/db';
import { emitAll, emitToUser } from '@/lib/realtime-bridge';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';
import { astroData } from '@/components/admin/astro-fields';

type Ctx = { params: Promise<{ id: string }> };

const ACTIONS = { approve: 'APPROVED', reject: 'REJECTED', suspend: 'SUSPENDED' } as const;

export const PATCH = adminRoute(async (_admin, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const b = await body(req);
  const a = await db.astrologer.findUnique({ where: { id }, include: { user: true } });
  if (!a) throw new HttpError(404, 'Astrologer not found.');

  if (typeof b.action === 'string') {
    const status = ACTIONS[b.action as keyof typeof ACTIONS];
    if (!status) throw new HttpError(400, 'Unknown action.');
    if (status !== 'APPROVED' && a.isBusy) throw new HttpError(409, 'This astrologer is in a live consultation right now. Try again after it ends.');
    await db.$transaction([
      db.astrologer.update({ where: { id }, data: { status, ...(status === 'APPROVED' ? {} : { isOnline: false }) } }),
      // admins keep their role; everyone else gets panel access only while approved
      ...(a.user.role === 'ADMIN' ? [] : [db.user.update({ where: { id: a.userId }, data: { role: status === 'APPROVED' ? 'ASTROLOGER' : 'USER' } })]),
      db.notification.create({
        data: {
          userId: a.userId,
          title: status === 'APPROVED' ? 'Your astrologer profile is approved 🎉' : status === 'REJECTED' ? 'Astrologer application update' : 'Astrologer profile suspended',
          body: status === 'APPROVED' ? 'Log in again to open your astrologer dashboard and go online.' : 'Please contact support for details.',
          link: status === 'APPROVED' ? '/astrologer-panel' : '/contact-us',
        },
      }),
    ]);
    emitAll('astro:status', { id, isOnline: status === 'APPROVED' ? a.isOnline : false, isBusy: false });
    emitToUser(a.userId, 'account:changed', { role: status === 'APPROVED' ? 'ASTROLOGER' : 'USER' });
    return Response.json({ ok: true, status });
  }

  const data = astroData(b);
  await db.astrologer.update({ where: { id }, data });
  return Response.json({ ok: true });
});
