import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { json, fmtDateTime, rupees } from '@/lib/format';
import { Stars } from '@/components/ui/primitives';
import { Transcript } from '@/components/consult/Transcript';

export default async function PanelSession({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await requireUser(['ASTROLOGER'], '/astrologer-panel/sessions');
  const a = u.astrologer!;
  const s = await db.consultSession.findUnique({ where: { id }, include: { user: true, review: true, messages: { orderBy: { createdAt: 'asc' } } } });
  if (!s || s.astrologerId !== a.id) notFound();
  const intake = json<Record<string, string>>(s.intake, {});

  return (
    <div className="space-y-5">
      <Link href="/astrologer-panel/sessions" className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> All consultations</Link>
      <h1 className="h-display text-2xl text-night-900">{s.type.toLowerCase()} with {s.user.name || 'User'}</h1>
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-5"><h2 className="mb-4 font-semibold">Transcript</h2><Transcript messages={s.messages} meId={u.id} names={{ [u.id]: 'You', [s.userId]: s.user.name || 'User' }} /></div>
        <div className="space-y-5">
          <dl className="card space-y-2 p-5 text-sm">
            {[['Date', fmtDateTime(s.createdAt)], ['Status', s.status.toLowerCase()], ['Billed', `${s.billedMinutes} min`], ['Billed amount', rupees(s.amount)], ['Your share', rupees(Math.floor((s.amount * (100 - a.commission)) / 100))], ['End reason', (s.endReason || '—').toLowerCase().replace(/_/g, ' ')]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold capitalize">{v}</dd></div>
            ))}
          </dl>
          {Object.keys(intake).length > 0 && (
            <dl className="card space-y-2 p-5 text-sm">
              <p className="eyebrow mb-2">Seeker details</p>
              {[['Name', intake.name], ['Gender', intake.gender], ['DOB', intake.dob], ['Time', intake.tob || '—'], ['Place', intake.place], ['Concern', intake.concern]].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right font-semibold">{v || '—'}</dd></div>
              ))}
            </dl>
          )}
          {s.review && <div className="card p-5"><p className="text-sm font-semibold">Review</p><Stars value={s.review.rating} className="mt-1" />{s.review.comment && <p className="mt-1 text-sm">{s.review.comment}</p>}</div>}
        </div>
      </div>
    </div>
  );
}
