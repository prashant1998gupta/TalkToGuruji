import Link from 'next/link';
import { Clock, IndianRupee, MessageCircle, Star } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { OnlineToggle } from '@/components/consult/OnlineToggle';
import { Avatar, Badge, Stars } from '@/components/ui/primitives';
import { fmtDateTime, rupees } from '@/lib/format';

export default async function PanelHome() {
  const u = await requireUser(['ASTROLOGER'], '/astrologer-panel');
  const a = u.astrologer!;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const share = (amt: number) => Math.floor((amt * (100 - a.commission)) / 100);

  const [today, active, recent, reviews] = await Promise.all([
    db.consultSession.findMany({ where: { astrologerId: a.id, status: 'ENDED', createdAt: { gte: since } }, select: { amount: true, billedMinutes: true } }),
    db.consultSession.findFirst({ where: { astrologerId: a.id, status: 'ACTIVE' }, include: { user: true } }),
    db.consultSession.findMany({ where: { astrologerId: a.id }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 6 }),
    db.review.findMany({ where: { astrologerId: a.id, hidden: false }, include: { user: true }, orderBy: { createdAt: 'desc' }, take: 3 }),
  ]);
  const todayEarn = today.reduce((s, x) => s + share(x.amount), 0);
  const todayMins = today.reduce((s, x) => s + x.billedMinutes, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Namaste</p>
        <h1 className="h-display mt-1 text-3xl text-night-900">{a.displayName}</h1>
      </div>
      <OnlineToggle astrologerId={a.id} initial={a.isOnline} busy={a.isBusy} />
      {active && (
        <Link href={`/consult/${active.id}`} className="flex items-center gap-3 rounded-3xl bg-night-900 p-5 text-white">
          <span className="h-3 w-3 animate-pulse-ring rounded-full bg-leaf" />
          <span className="flex-1">Ongoing {active.type.toLowerCase()} with <b>{active.user.name || 'User'}</b></span>
          <span className="btn-gold btn-sm">Rejoin</span>
        </Link>
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { i: IndianRupee, v: rupees(todayEarn), l: "Today's earnings" },
          { i: Clock, v: `${todayMins} min`, l: 'Consulted today' },
          { i: MessageCircle, v: String(today.length), l: 'Sessions today' },
          { i: Star, v: a.rating.toFixed(1), l: `${a.ratingCount} ratings` },
        ].map(({ i: I, v, l }) => (
          <div key={l} className="card p-4">
            <I className="h-5 w-5 text-saffron-500" />
            <p className="mt-2 font-display text-2xl font-semibold text-night-900">{v}</p>
            <p className="text-xs text-muted">{l}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Recent consultations</h2><Link href="/astrologer-panel/sessions" className="text-sm font-semibold text-saffron-600">View all</Link></div>
          {recent.length === 0 ? <p className="mt-4 text-sm text-muted">No consultations yet. Go online to receive requests.</p> : (
            <ul className="mt-3 divide-y divide-line">
              {recent.map((s) => (
                <li key={s.id}>
                  <Link href={s.status === 'ACTIVE' ? `/consult/${s.id}` : `/astrologer-panel/sessions/${s.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <Avatar name={s.user.name || 'User'} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.user.name || 'User'} <span className="font-normal text-muted">· {s.type.toLowerCase()}</span></p>
                      <p className="text-xs text-muted">{fmtDateTime(s.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{rupees(share(s.amount))}</p>
                      <Badge tone={s.status === 'ENDED' ? 'green' : s.status === 'ACTIVE' ? 'saffron' : 'neutral'}>{s.status.toLowerCase()}</Badge>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="font-semibold">Lifetime</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Total earnings</dt><dd className="font-bold">{rupees(a.earnings)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Minutes consulted</dt><dd className="font-bold">{a.totalMinutes.toLocaleString('en-IN')}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Platform commission</dt><dd className="font-bold">{a.commission}%</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Chat / Call / Video</dt><dd className="font-bold">{rupees(a.chatPrice)} · {rupees(a.callPrice)} · {rupees(a.videoPrice)}</dd></div>
            </dl>
          </div>
          <div className="card p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold">Latest reviews</h2><Link href="/astrologer-panel/reviews" className="text-sm font-semibold text-saffron-600">All</Link></div>
            {reviews.map((r) => (
              <div key={r.id} className="mt-3 border-t border-line pt-3 first:border-0">
                <p className="flex items-center gap-2 text-sm font-semibold">{r.user.name || 'User'} <Stars value={r.rating} size={11} /></p>
                {r.comment && <p className="mt-0.5 text-sm text-ink/75">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
