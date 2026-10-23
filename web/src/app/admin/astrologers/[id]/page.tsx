import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { db } from '@/lib/db';
import { fmtDate, fmtDateTime, rupees } from '@/lib/format';
import { KV, PageHeader, Pill, Section, Stat } from '@/components/admin/ui';
import { AstroForm, AstroStatusActions } from '@/components/admin/AstroForm';

export default async function AstrologerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db.astrologer.findUnique({ where: { id }, include: { user: true } });
  if (!a) notFound();
  const [sessions, agg, reviews] = await Promise.all([
    db.consultSession.findMany({ where: { astrologerId: id }, orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { name: true, phone: true } } } }),
    db.consultSession.aggregate({ where: { astrologerId: id, status: 'ENDED' }, _sum: { amount: true, billedMinutes: true }, _count: true }),
    db.review.findMany({ where: { astrologerId: id }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true } } } }),
  ]);

  return (
    <>
      <Link href={`/admin/astrologers?status=${a.status}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Astrologers</Link>
      <PageHeader
        title={a.displayName}
        sub={<><Pill v={a.status} /> · login +91 {a.user.phone} · since {fmtDate(a.createdAt)} {a.isOnline && a.status === 'APPROVED' && <span className="font-semibold text-leaf">· online</span>}</>}
        actions={<>
          <AstroStatusActions id={a.id} status={a.status} />
          {a.status === 'APPROVED' && <Link href={`/astrologer/${a.slug}`} target="_blank" className="btn-ghost"><ExternalLink className="h-3.5 w-3.5" /> Public profile</Link>}
        </>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Completed sessions" value={agg._count} />
        <Stat label="Billed minutes" value={(agg._sum.billedMinutes || 0).toLocaleString('en-IN')} />
        <Stat label="Gross billing" value={rupees(agg._sum.amount || 0)} />
        <Stat label="Astrologer earnings" value={rupees(a.earnings)} tone="good" hint={`after ${a.commission}% commission`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <AstroForm
          id={a.id}
          initial={{
            displayName: a.displayName, slug: a.slug, avatar: a.avatar || '', bio: a.bio, skills: a.skills, languages: a.languages, experience: a.experience,
            qualification: a.qualification || '', gender: a.gender || '', city: a.city || '', chatPrice: a.chatPrice / 100, callPrice: a.callPrice / 100,
            videoPrice: a.videoPrice / 100, commission: a.commission, freeMinutes: a.freeMinutes, isChat: a.isChat, isCall: a.isCall, isVideo: a.isVideo, featured: a.featured,
          }}
        />
        <div className="space-y-6">
          <Section title="Account">
            <KV rows={[['User', <Link key="u" href={`/admin/users/${a.userId}`} className="text-saffron-700 underline">{a.user.name || a.user.phone}</Link>], ['Role', <Pill key="r" v={a.user.role} />], ['Rating', `${a.rating.toFixed(1)} (${a.ratingCount})`], ['Total minutes', a.totalMinutes.toLocaleString('en-IN')]]} />
          </Section>
          <Section title="Recent sessions">
            <ul className="divide-y divide-line text-sm">
              {sessions.map((s) => (
                <li key={s.id}><Link href={`/admin/consultations/${s.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-saffron-700"><span className="truncate">{s.user.name || s.user.phone} · {s.type.toLowerCase()} · {fmtDateTime(s.createdAt)}</span><Pill v={s.status} /></Link></li>
              ))}
              {!sessions.length && <li className="py-4 text-muted">No sessions yet.</li>}
            </ul>
          </Section>
          <Section title="Latest reviews" action={<Link href={`/admin/reviews?astrologer=${a.id}`} className="text-xs font-semibold text-saffron-600">Moderate</Link>}>
            <ul className="space-y-3 text-sm">
              {reviews.map((r) => <li key={r.id} className={r.hidden ? 'opacity-50' : ''}><b>{'★'.repeat(r.rating)}</b> <span className="text-muted">— {r.user.name || 'User'}</span><p className="text-ink/80">{r.comment}</p></li>)}
              {!reviews.length && <li className="text-muted">No reviews yet.</li>}
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}
