import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, Phone, Video } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Avatar, Badge, EmptyState, Pagination, Stars } from '@/components/ui/primitives';
import { fmtDateTime, rupees } from '@/lib/format';

export const metadata: Metadata = { title: 'My consultations', robots: { index: false } };

const ICON = { CHAT: MessageCircle, CALL: Phone, VIDEO: Video } as const;
const STATUS_TONE: Record<string, 'green' | 'saffron' | 'red' | 'neutral'> = { ACTIVE: 'green', REQUESTED: 'saffron', ENDED: 'neutral', MISSED: 'red', REJECTED: 'red', CANCELLED: 'neutral' };

export default async function ConsultationsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const u = await requireUser(undefined, '/account/consultations');
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [rows, total] = await Promise.all([
    db.consultSession.findMany({ where: { userId: u.id }, include: { astrologer: true, review: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 12, take: 12 }),
    db.consultSession.count({ where: { userId: u.id } }),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">My consultations</h1>
      {rows.length === 0 ? (
        <div className="mt-5"><EmptyState title="No consultations yet" text="Your chats and calls with astrologers will appear here." action={<Link href="/astrology-services/live-astrologers" className="btn-primary">Talk to an astrologer</Link>} /></div>
      ) : (
        <ul className="mt-5 space-y-3">
          {rows.map((s) => {
            const I = ICON[s.type as keyof typeof ICON] || MessageCircle;
            const live = s.status === 'ACTIVE' || s.status === 'REQUESTED';
            return (
              <li key={s.id}>
                <Link href={live ? `/consult/${s.id}` : `/account/consultations/${s.id}`} className="card-hover flex items-center gap-4 p-4">
                  <Avatar name={s.astrologer.displayName} src={s.astrologer.avatar} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">{s.astrologer.displayName} <Badge tone={STATUS_TONE[s.status]}>{s.status === 'ACTIVE' ? 'Live now' : s.status.toLowerCase()}</Badge></p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><I className="h-3.5 w-3.5" /> {s.type.toLowerCase()} · {fmtDateTime(s.createdAt)}</p>
                    {s.review && <Stars value={s.review.rating} size={11} className="mt-1" />}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold tabular-nums">{rupees(s.amount)}</p>
                    <p className="text-xs text-muted">{s.billedMinutes} min</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <Pagination page={page} pages={Math.ceil(total / 12)} href={(p) => `/account/consultations?page=${p}`} />
    </div>
  );
}
