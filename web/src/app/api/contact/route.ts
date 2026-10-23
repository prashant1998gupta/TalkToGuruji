import { z } from 'zod';
import { db } from '@/lib/db';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  phone: z.union([z.string().trim().regex(/^[0-9+\-\s]{7,15}$/), z.literal('')]).optional(),
  message: z.string().trim().min(10).max(2000),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please fill in your name, a valid email and a message of at least 10 characters.' }, { status: 400 });
  const { name, email, phone, message } = parsed.data;
  await db.contactMessage.create({ data: { name, email: email.toLowerCase(), phone: phone || null, message } });
  return Response.json({ message: 'Thank you! Our team will get back to you within 24 hours.' });
}
