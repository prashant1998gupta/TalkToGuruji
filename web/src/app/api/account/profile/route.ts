import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  const u = await apiUser();
  if (u instanceof Response) return Response.json({ profile: null });
  const { name, email, gender, birthDate, birthTime, birthPlace, phone } = u;
  return Response.json({ profile: { name, email, gender, birthDate, birthTime, birthPlace, phone } });
}

const schema = z.object({
  name: z.string().trim().max(60).optional(),
  email: z.union([z.email(), z.literal('')]).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  birthDate: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal('')]).optional(),
  birthTime: z.union([z.string().regex(/^\d{2}:\d{2}$/), z.literal('')]).optional(),
  birthPlace: z.string().trim().max(120).optional(),
});

export async function PATCH(req: Request) {
  const u = await apiUser();
  if (u instanceof Response) return u;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please check the details you entered.' }, { status: 400 });
  const d = parsed.data;
  const data = Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined).map(([k, v]) => [k, v === '' ? null : v]));
  await db.user.update({ where: { id: u.id }, data });
  return Response.json({ ok: true });
}
