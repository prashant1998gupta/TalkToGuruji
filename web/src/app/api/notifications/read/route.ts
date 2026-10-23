import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST() {
  const u = await apiUser();
  if (u instanceof Response) return u;
  await db.notification.updateMany({ where: { userId: u.id, read: false }, data: { read: true } });
  return Response.json({ ok: true });
}
