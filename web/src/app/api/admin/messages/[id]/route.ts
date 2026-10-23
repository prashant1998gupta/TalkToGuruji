import { db } from '@/lib/db';
import { adminRoute, body } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = adminRoute(async (_admin, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { handled } = await body(req);
  await db.contactMessage.update({ where: { id }, data: { handled: handled !== false } });
  return Response.json({ ok: true });
});

export const DELETE = adminRoute(async (_admin, _req: Request, { params }: Ctx) => {
  await db.contactMessage.delete({ where: { id: (await params).id } });
  return Response.json({ ok: true });
});
