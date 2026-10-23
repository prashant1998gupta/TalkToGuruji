import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Avatar, Badge, EmptyState, Pagination } from '@/components/ui/primitives';
import { fmtDateTime, rupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Consultations' };

export default async function PanelSessions({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const sp = await searchParams;
  const u = await requireUser(['ASTROLOGER'], '/astrologer-panel/sessions');
  const a = u.astrologer!;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = { astrologerId: a.id, ...(sp.status ? { status: sp.status } : {}) };
  const [rows, total] = await Promise.all([
    db.consultSession.findMany({ where, include: { user: true, review: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 15, take: 15 }),
    db.consultSession.count({ where }),
  ]);
  const tabs = [['', 'All'], ['ENDED', 'Completed'], ['MISSED', 'Missed'], ['REJECTED', 'Declined']];

  return (
    <div>
      <h1 className="h-display text-3xl text-night-900">Consultations</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map(([v, l]) => (
          <Link key={v} href={v ? `?status=${v}` : '?'} className={`rounded-full px-4 py-1.5 text-sm font-semibold ring-1 ${(sp.status || '') === v ? 'bg-night-900 text-white ring-night-900' : 'bg-white ring-line'}`}>{l}</Link>
        ))}
      </div>
      {rows.length === 0 ? <div className="mt-6"><EmptyState title="Nothing here yet" /></div> : (
        <div className="card mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-cream-100 text-left text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">When</th><th className="px-4 py-3">Minutes</th><th className="px-4 py-3">Your share</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((s) => (
                <tr key={s.id} className="hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link href={s.status === 'ACTIVE' ? `/consult/${s.id}` : `/astrologer-panel/sessions/${s.id}`} className="flex items-center gap-2.5 font-semibold hover:text-saffron-700">
                      <Avatar name={s.user.name || 'User'} size={32} /> {s.user.name || 'User'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{s.type.toLowerCase()}</td>
                  <td className="px-4 py-3 text-muted">{fmtDateTime(s.createdAt)}</td>
                  <td className="px-4 py-3 tabular-nums">{s.billedMinutes}</td>
                  <td className="px-4 py-3 font-semibold tabular-nums">{rupees(Math.floor((s.amount * (100 - a.commission)) / 100))}</td>
                  <td className="px-4 py-3"><Badge tone={s.status === 'ENDED' ? 'green' : s.status === 'ACTIVE' ? 'saffron' : 'red'}>{s.status.toLowerCase()}</Badge>{s.review && <span className="ml-2 text-xs text-gold-500">★ {s.review.rating}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total / 15)} href={(p) => `?page=${p}${sp.status ? `&status=${sp.status}` : ''}`} />
    </div>
  );
}
