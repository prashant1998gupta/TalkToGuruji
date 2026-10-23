import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { rupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Earnings' };

export default async function Earnings() {
  const u = await requireUser(['ASTROLOGER'], '/astrologer-panel/earnings');
  const a = u.astrologer!;
  const share = (amt: number) => Math.floor((amt * (100 - a.commission)) / 100);
  const since = new Date(Date.now() - 29 * 86400000);
  since.setHours(0, 0, 0, 0);
  const sessions = await db.consultSession.findMany({ where: { astrologerId: a.id, status: 'ENDED' }, orderBy: { createdAt: 'desc' }, include: { user: true } });

  // last 30 days, one bar per day
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    return { key: d.toDateString(), label: d.getDate(), month: d.toLocaleDateString('en-IN', { month: 'short' }), v: 0 };
  });
  for (const s of sessions) {
    const day = days.find((d) => d.key === s.createdAt.toDateString());
    if (day) day.v += share(s.amount);
  }
  const max = Math.max(1, ...days.map((d) => d.v));
  const month = days.reduce((s, d) => s + d.v, 0);
  const byType = ['CHAT', 'CALL', 'VIDEO'].map((t) => ({ t, v: sessions.filter((s) => s.type === t).reduce((x, s) => x + share(s.amount), 0) }));

  return (
    <div className="space-y-6">
      <h1 className="h-display text-3xl text-night-900">Earnings</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[['Lifetime', rupees(a.earnings)], ['Last 30 days', rupees(month)], ['Sessions', String(sessions.length)], ['Commission', `${a.commission}%`]].map(([l, v]) => (
          <div key={l} className="card p-4"><p className="text-xs text-muted">{l}</p><p className="mt-1 font-display text-2xl font-semibold text-night-900">{v}</p></div>
        ))}
      </div>
      <div className="card p-5">
        <h2 className="font-semibold">Last 30 days</h2>
        <div className="mt-5 flex h-48 items-end gap-1" role="img" aria-label="Daily earnings, last 30 days">
          {days.map((d) => (
            <div key={d.key} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="rounded-t bg-gradient-to-t from-saffron-500 to-gold-400 transition group-hover:brightness-110" style={{ height: `${Math.max(d.v ? 4 : 1, (d.v / max) * 100)}%`, opacity: d.v ? 1 : 0.25 }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-night-900 px-1.5 py-0.5 text-[10px] text-white group-hover:block">{d.label} {d.month}: {rupees(d.v)}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-muted"><span>{days[0].label} {days[0].month}</span><span>Today</span></div>
        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          {byType.map(({ t, v }) => <span key={t} className="chip capitalize">{t.toLowerCase()}: <b>{rupees(v)}</b></span>)}
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Billed</th><th className="px-4 py-3">Your share</th></tr></thead>
          <tbody className="divide-y divide-line">
            {sessions.slice(0, 50).map((s) => (
              <tr key={s.id}><td className="px-4 py-2.5 text-muted">{s.createdAt.toLocaleDateString('en-IN')}</td><td className="px-4 py-2.5">{s.user.name || 'User'}</td><td className="px-4 py-2.5 capitalize">{s.type.toLowerCase()}</td><td className="px-4 py-2.5 tabular-nums">{rupees(s.amount)}</td><td className="px-4 py-2.5 font-semibold tabular-nums">{rupees(share(s.amount))}</td></tr>
            ))}
            {!sessions.length && <tr><td colSpan={5} className="px-4 py-6 text-center text-muted">No completed consultations yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
