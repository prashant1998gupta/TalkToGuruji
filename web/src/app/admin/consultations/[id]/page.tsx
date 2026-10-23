import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { fmtDateTime, json, rupees } from '@/lib/format';
import { KV, PageHeader, Pill, Section } from '@/components/admin/ui';
import { cx } from '@/lib/format';

export default async function ConsultationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.consultSession.findUnique({
    where: { id },
    include: { user: true, astrologer: true, messages: { orderBy: { createdAt: 'asc' } }, review: true },
  });
  if (!s) notFound();
  const intake = json<Record<string, string>>(s.intake, {});
  const share = Math.floor((s.amount * (100 - s.astrologer.commission)) / 100);
  const duration = s.startedAt && s.endedAt ? Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 60000) : null;

  return (
    <>
      <Link href="/admin/consultations" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Consultations</Link>
      <PageHeader title={`${s.type[0] + s.type.slice(1).toLowerCase()} · ${s.user.name || s.user.phone} → ${s.astrologer.displayName}`} sub={<><Pill v={s.status} /> · {fmtDateTime(s.createdAt)} · #{s.id}</>} />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Section title="Billing">
            <KV rows={[
              ['Rate', `${rupees(s.ratePerMin)}/min`], ['Free minutes', s.freeMinutes], ['Billed minutes', s.billedMinutes], ['Wall-clock', duration != null ? `${duration} min` : '—'],
              ['Charged to user', <b key="c">{rupees(s.amount)}</b>], [`Astrologer (${100 - s.astrologer.commission}%)`, rupees(share)], ['Platform', rupees(s.amount - share)],
              ['Started', s.startedAt ? fmtDateTime(s.startedAt) : '—'], ['Ended', s.endedAt ? fmtDateTime(s.endedAt) : '—'], ['End reason', s.endReason?.replace(/_/g, ' ').toLowerCase()],
            ]} />
          </Section>
          <Section title="Intake">
            <KV rows={[['Name', intake.name], ['Gender', intake.gender], ['DOB', intake.dob], ['Time', intake.tob], ['Place', intake.place], ['Concern', intake.concern]]} />
          </Section>
          <Section title="People">
            <KV rows={[
              ['User', <Link key="u" href={`/admin/users/${s.userId}`} className="text-saffron-700 underline">{s.user.name || s.user.phone}</Link>],
              ['Astrologer', <Link key="a" href={`/admin/astrologers/${s.astrologerId}`} className="text-saffron-700 underline">{s.astrologer.displayName}</Link>],
              ['Review', s.review ? `${'★'.repeat(s.review.rating)} ${s.review.comment}` : null],
            ]} />
          </Section>
        </div>
        <Section title={`Transcript (${s.messages.length})`}>
          {s.type !== 'CHAT' && <p className="mb-3 rounded-xl bg-cream-100 px-3 py-2 text-xs text-muted">Voice and video calls are peer-to-peer and are not recorded. Only chat messages exchanged during the call appear here.</p>}
          <div className="max-h-[70vh] space-y-2 overflow-y-auto rounded-2xl bg-cream-100 p-4">
            {s.messages.map((m) => {
              if (m.kind === 'SYSTEM') return <p key={m.id} className="text-center text-xs text-muted">{m.body}</p>;
              const mine = m.senderId === s.userId;
              return (
                <div key={m.id} className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cx('max-w-[75%] rounded-2xl px-3.5 py-2 text-sm', mine ? 'rounded-br-md bg-night-900 text-white' : 'rounded-bl-md bg-white ring-1 ring-line')}>
                    <p className={cx('mb-0.5 text-[10px] font-bold uppercase tracking-wide', mine ? 'text-gold-300' : 'text-saffron-600')}>{mine ? s.user.name || 'User' : s.astrologer.displayName}</p>
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={cx('mt-0.5 text-right text-[10px]', mine ? 'text-white/50' : 'text-muted')}>{m.createdAt.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
            {!s.messages.length && <p className="py-8 text-center text-sm text-muted">No messages.</p>}
          </div>
        </Section>
      </div>
    </>
  );
}
