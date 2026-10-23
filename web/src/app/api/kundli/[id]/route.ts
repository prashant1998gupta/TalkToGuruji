import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await apiUser();
  if (u instanceof Response) return u;
  const { id } = await params;
  const res = await db.kundli.deleteMany({ where: { id, userId: u.id } });
  if (!res.count) return Response.json({ error: 'Not found.' }, { status: 404 });
  return Response.json({ ok: true });
}
