import { db } from '@/lib/db';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = adminRoute(async (admin, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const b = await body(req);
  if (id === admin.id && (b.blocked === true || (b.role && b.role !== 'ADMIN'))) throw new HttpError(400, 'You cannot block or demote your own account.');
  const data: { blocked?: boolean; role?: string; name?: string | null; email?: string | null } = {};
  if (typeof b.blocked === 'boolean') data.blocked = b.blocked;
  if (typeof b.role === 'string') {
    if (!['USER', 'ASTROLOGER', 'ADMIN'].includes(b.role)) throw new HttpError(400, 'Invalid role.');
    if (b.role === 'ASTROLOGER') {
      const a = await db.astrologer.findUnique({ where: { userId: id } });
      if (!a || a.status !== 'APPROVED') throw new HttpError(400, 'Approve an astrologer profile for this user first.');
    }
    data.role = b.role;
  }
  if (typeof b.name === 'string') data.name = b.name.trim() || null;
  if (typeof b.email === 'string') data.email = b.email.trim() || null;
  await db.user.update({ where: { id }, data });
  return Response.json({ ok: true });
});
