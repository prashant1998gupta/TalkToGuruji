import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';

const price = z.number().int().min(5).max(1000); // rupees per minute
const schema = z.object({
  displayName: z.string().trim().min(3).max(60),
  bio: z.string().trim().max(1500),
  skills: z.string().trim().max(200),
  languages: z.string().trim().max(200),
  experience: z.number().int().min(0).max(70),
  qualification: z.string().trim().max(100).optional(),
  city: z.string().trim().max(60).optional(),
  chatPrice: price,
  callPrice: price,
  videoPrice: price,
  isChat: z.boolean(),
  isCall: z.boolean(),
  isVideo: z.boolean(),
});

export async function PATCH(req: Request) {
  const u = await apiUser(['ASTROLOGER']);
  if (u instanceof Response) return u;
  if (!u.astrologer) return Response.json({ error: 'No astrologer profile.' }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please check the fields. Prices must be ₹5–₹1000 per minute.' }, { status: 400 });
  const d = parsed.data;
  if (!d.isChat && !d.isCall && !d.isVideo) return Response.json({ error: 'Keep at least one consultation mode enabled.' }, { status: 400 });
  await db.astrologer.update({
    where: { id: u.astrologer.id },
    data: { ...d, chatPrice: d.chatPrice * 100, callPrice: d.callPrice * 100, videoPrice: d.videoPrice * 100 },
  });
  return Response.json({ ok: true });
}
