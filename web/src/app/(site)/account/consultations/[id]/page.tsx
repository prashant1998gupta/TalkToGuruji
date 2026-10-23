import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Avatar, Badge, Stars } from '@/components/ui/primitives';
import { Transcript } from '@/components/consult/Transcript';
import { ReviewButton } from '@/components/consult/ReviewButton';
import { fmtDateTime, rupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Consultation details', robots: { index: false } };

export default async function ConsultationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser(undefined, `/account/consultations/${id}`);
  const s = await db.consultSession.findUnique({ where: { id }, include: { astrologer: true, review: true, messages: { orderBy: { createdAt: 'asc' } } } });
  if (!s || s.userId !== u.id) notFound();
  const mins = s.startedAt && s.endedAt ? Math.max(1, Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 60000)) : 0;

  return (
    <div className="space-y-5">
      <Link href="/account/consultations" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> All consultations</Link>
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <Avatar name={s.astrologer.displayName} src={s.astrologer.avatar} size={56} />
        <div className="min-w-0 flex-1">
          <Link href={`/astrologer/${s.astrologer.slug}`} className="font-display text-xl font-semibold hover:text-saffron-700">{s.astrologer.displayName}</Link>
          <p className="text-sm text-muted">{s.type.toLowerCase()} consultation · {fmtDateTime(s.createdAt)}</p>
        </div>
        <Badge tone={s.status === 'ENDED' ? 'neutral' : 'red'}>{s.status.toLowerCase()}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Duration', `${mins} min`], ['Billed minutes', String(s.billedMinutes)], ['Rate', `${rupees(s.ratePerMin)}/min`], ['Total charged', rupees(s.amount)]].map(([k, v]) => (
          <div key={k} className="card p-4"><dt className="text-xs text-muted">{k}</dt><dd className="mt-1 font-semibold tabular-nums">{v}</dd></div>
        ))}
      </dl>
      {s.status === 'ENDED' && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-5">
          {s.review ? (
            <div><p className="text-sm font-semibold">Your review</p><Stars value={s.review.rating} className="mt-1" />{s.review.comment && <p className="mt-1 text-sm text-ink/80">{s.review.comment}</p>}</div>
          ) : (
            <p className="text-sm text-muted">How was your consultation? Your review helps others.</p>
          )}
          <ReviewButton sessionId={s.id} astroName={s.astrologer.displayName} label={s.review ? 'Edit review' : 'Rate this consultation'} />
        </div>
      )}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Transcript</h2>
        <Transcript messages={s.messages} meId={u.id} names={{ [u.id]: 'You', [s.astrologer.userId]: s.astrologer.displayName }} />
      </div>
    </div>
  );
}
