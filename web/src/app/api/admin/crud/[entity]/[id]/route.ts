import { db } from '@/lib/db';
import { adminRoute, body, coerce, delegate, entityOr404, HttpError } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ entity: string; id: string }> };

export const PATCH = adminRoute(async (_admin, req: Request, { params }: Ctx) => {
  const { entity: key, id } = await params;
  const entity = entityOr404(key);
  const data = coerce(entity, await body(req), true);
  await delegate(entity.model).update({ where: { id }, data });
  return Response.json({ ok: true, id });
});

export const DELETE = adminRoute(async (_admin, _req: Request, { params }: Ctx) => {
  const { entity: key, id } = await params;
  const entity = entityOr404(key);
  // These relations cascade in the schema — refuse rather than silently wiping history.
  if (key === 'productCategory' && (await db.product.count({ where: { categoryId: id } })) > 0) throw new HttpError(409, 'Move or delete the products in this category first.');
  if (key === 'puja' && (await db.pujaBooking.count({ where: { pujaId: id } })) > 0) throw new HttpError(409, 'This puja has bookings. Hide it instead of deleting.');
  await delegate(entity.model).delete({ where: { id } });
  return Response.json({ ok: true });
});
