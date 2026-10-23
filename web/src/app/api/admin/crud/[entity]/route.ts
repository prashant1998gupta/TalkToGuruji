import { adminRoute, body, coerce, delegate, entityOr404 } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ entity: string }> };

export const POST = adminRoute(async (_admin, req: Request, { params }: Ctx) => {
  const entity = entityOr404((await params).entity);
  const data = coerce(entity, await body(req), false);
  const row = await delegate(entity.model).create({ data });
  return Response.json({ ok: true, id: row.id });
});
