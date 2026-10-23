import { db } from '@/lib/db';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';

export const PUT = adminRoute(async (_admin, req: Request) => {
  const b = await body(req);
  const key = String(b.key || '').trim();
  if (!/^[a-z0-9_]{2,60}$/.test(key)) throw new HttpError(400, 'Key must be lowercase letters, numbers and underscores.');
  const value = String(b.value ?? '');
  if (key === 'gst_percent' && !(Number(value) >= 0 && Number(value) <= 50)) throw new HttpError(400, 'GST % must be between 0 and 50.');
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  return Response.json({ ok: true });
});

export const DELETE = adminRoute(async (_admin, req: Request) => {
  const key = new URL(req.url).searchParams.get('key') || '';
  await db.setting.delete({ where: { key } });
  return Response.json({ ok: true });
});
