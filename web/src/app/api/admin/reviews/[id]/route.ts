import { db } from '@/lib/db';
import { adminRoute, body, HttpError, recomputeRating } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = adminRoute(async (_admin, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { hidden } = await body(req);
  if (typeof hidden !== 'boolean') throw new HttpError(400, 'hidden must be true or false.');
  const r = await db.review.update({ where: { id }, data: { hidden } });
  await recomputeRating(r.astrologerId);
  return Response.json({ ok: true });
});
