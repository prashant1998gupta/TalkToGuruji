import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ConsultRoom, type RoomSession } from '@/components/consult/ConsultRoom';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Consultation', robots: { index: false } };

export default async function ConsultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireUser(undefined, `/consult/${id}`);
  const s = await db.consultSession.findUnique({ where: { id }, include: { user: true, astrologer: true, review: true } });
  if (!s || (s.userId !== me.id && s.astrologer.userId !== me.id)) notFound();

  const initial: RoomSession = {
    id: s.id, type: s.type as RoomSession['type'], status: s.status, ratePerMin: s.ratePerMin, freeMinutes: s.freeMinutes, billedMinutes: s.billedMinutes,
    amount: s.amount, startedAt: s.startedAt?.toISOString() ?? null, endedAt: s.endedAt?.toISOString() ?? null, endReason: s.endReason,
    intake: s.intake ? JSON.parse(s.intake) : null,
    user: { id: s.user.id, name: s.user.name || 'User' },
    astrologer: { id: s.astrologer.id, userId: s.astrologer.userId, name: s.astrologer.displayName, slug: s.astrologer.slug, avatar: s.astrologer.avatar },
  };
  return <ConsultRoom initial={initial} role={s.userId === me.id ? 'user' : 'astrologer'} meId={me.id} reviewed={!!s.review} />;
}
