import { z } from 'zod';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const parsed = z.object({ email: z.email() }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please enter a valid email.' }, { status: 400 });
  const email = parsed.data.email.toLowerCase();
  await db.subscriber.upsert({ where: { email }, update: {}, create: { email } });
  return Response.json({ message: 'Subscribed! Watch your inbox for the next rashifal.' });
}
