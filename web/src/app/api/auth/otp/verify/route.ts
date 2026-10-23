import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');

export async function POST(req: Request) {
  const parsed = z
    .object({ phone: z.string().regex(/^[6-9]\d{9}$/), code: z.string().regex(/^\d{6}$/), name: z.string().trim().max(60).optional() })
    .safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Enter the 6-digit OTP.' }, { status: 400 });
  const { phone, code, name } = parsed.data;

  const otp = await db.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: 'desc' } });
  if (!otp || otp.expiresAt < new Date()) return Response.json({ error: 'OTP expired. Please request a new one.' }, { status: 400 });
  if (otp.attempts >= 5) return Response.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 429 });
  if (otp.code !== hash(code)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return Response.json({ error: 'Incorrect OTP. Please try again.' }, { status: 400 });
  }
  await db.otpCode.deleteMany({ where: { phone } });

  let user = await db.user.findUnique({ where: { phone } });
  const isNew = !user;
  if (!user) user = await db.user.create({ data: { phone, name: name || null } });
  else if (name && !user.name) user = await db.user.update({ where: { id: user.id }, data: { name } });
  if (user.blocked) return Response.json({ error: 'This account has been suspended. Contact support.' }, { status: 403 });

  await setSessionCookie(user.id);
  const home = user.role === 'ADMIN' ? '/admin' : user.role === 'ASTROLOGER' ? '/astrologer-panel' : null;
  return Response.json({ ok: true, isNew, home });
}
