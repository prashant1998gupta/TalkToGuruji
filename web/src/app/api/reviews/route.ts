import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';

const schema = z.object({ sessionId: z.string(), rating: z.number().int().min(1).max(5), comment: z.string().trim().max(600).default('') });

export async function POST(req: Request) {
  const u = await apiUser();
  if (u instanceof Response) return u;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please choose a rating from 1 to 5.' }, { status: 400 });
  const { sessionId, rating, comment } = parsed.data;

  const s = await db.consultSession.findUnique({ where: { id: sessionId }, include: { review: true } });
  if (!s || s.userId !== u.id) return Response.json({ error: 'Consultation not found.' }, { status: 404 });
  if (s.status !== 'ENDED') return Response.json({ error: 'You can review once the consultation has ended.' }, { status: 400 });

  await db.$transaction(async (tx) => {
    if (s.review) await tx.review.update({ where: { id: s.review.id }, data: { rating, comment } });
    else await tx.review.create({ data: { sessionId, userId: u.id, astrologerId: s.astrologerId, rating, comment } });
    // keep the denormalised average in step with the real review rows
    const agg = await tx.review.aggregate({ where: { astrologerId: s.astrologerId, hidden: false }, _avg: { rating: true } });
    const a = await tx.astrologer.findUniqueOrThrow({ where: { id: s.astrologerId } });
    await tx.astrologer.update({
      where: { id: s.astrologerId },
      data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, ratingCount: s.review ? a.ratingCount : a.ratingCount + 1 },
    });
  });
  return Response.json({ ok: true });
}
