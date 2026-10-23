import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Avatar, EmptyState, Stars } from '@/components/ui/primitives';
import { fmtDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Reviews' };

export default async function PanelReviews() {
  const u = await requireUser(['ASTROLOGER'], '/astrologer-panel/reviews');
  const a = u.astrologer!;
  const reviews = await db.review.findMany({ where: { astrologerId: a.id }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="h-display text-3xl text-night-900">Reviews</h1>
        <p className="flex items-center gap-2 text-sm"><Stars value={a.rating} /> <b>{a.rating.toFixed(1)}</b> <span className="text-muted">({a.ratingCount})</span></p>
      </div>
      {reviews.length === 0 ? <div className="mt-6"><EmptyState title="No reviews yet" /></div> : (
        <ul className="mt-5 space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="card flex gap-3 p-4">
              <Avatar name={r.user.name || 'User'} size={40} />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{r.user.name || 'User'} <Stars value={r.rating} size={12} />{r.hidden && <span className="text-xs text-rose">hidden by admin</span>}</p>
                {r.comment && <p className="mt-1 text-sm text-ink/80">{r.comment}</p>}
                <p className="mt-1 text-xs text-muted">{fmtDate(r.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
