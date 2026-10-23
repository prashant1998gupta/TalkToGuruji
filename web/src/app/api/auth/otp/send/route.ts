import { createHash, randomInt } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { isLocalMode } from '@/lib/config';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');

export async function POST(req: Request) {
  const parsed = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Enter a valid 10-digit mobile number.' }, { status: 400 });
  const { phone } = parsed.data;

  const recent = await db.otpCode.findFirst({ where: { phone, createdAt: { gt: new Date(Date.now() - 30_000) } } });
  if (recent) return Response.json({ error: 'Please wait 30 seconds before requesting another OTP.' }, { status: 429 });

  const code = String(randomInt(100000, 1000000));
  await db.otpCode.deleteMany({ where: { phone } });
  await db.otpCode.create({ data: { phone, code: hash(code), expiresAt: new Date(Date.now() + 5 * 60_000) } });

  // TODO(production): send `code` through an SMS provider (MSG91 / Twilio) here instead of returning it.
  if (isLocalMode()) {
    console.log(`[OTP] ${phone}: ${code}`);
    return Response.json({ ok: true, devCode: code });
  }
  return Response.json({ ok: true });
}
