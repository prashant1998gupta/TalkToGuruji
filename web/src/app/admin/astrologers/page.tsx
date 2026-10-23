import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDate, rupees } from '@/lib/format';
import { Avatar } from '@/components/ui/primitives';
import { FilterBar, PageHeader, Pager, Pill, Table, Tabs, pageParam, qs } from '@/components/admin/ui';
import { AstroStatusActions } from '@/components/admin/AstroForm';

export const metadata = { title: 'Astrologers' };
const PER = 25;
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;

export default async function AstrologersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = (STATUSES as readonly string[]).includes(sp.status || '') ? sp.status! : 'APPROVED';
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const where: Prisma.AstrologerWhereInput = { status, ...(q ? { OR: [{ displayName: { contains: q } }, { skills: { contains: q } }, { user: { phone: { contains: q } } }] } : {}) };
  const [rows, total, counts] = await Promise.all([
    db.astrologer.findMany({ where, orderBy: status === 'PENDING' ? { createdAt: 'asc' } : [{ isOnline: 'desc' }, { rating: 'desc' }], skip: (page - 1) * PER, take: PER, include: { user: { select: { phone: true } } } }),
    db.astrologer.count({ where }),
    db.astrologer.groupBy({ by: ['status'], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader title="Astrologers" sub="Approve applications, set prices and commission." actions={<Link href="/admin/astrologers/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Add astrologer</Link>} />
      <Tabs active={status} tabs={STATUSES.map((s) => ({ key: s, label: s[0] + s.slice(1).toLowerCase(), href: qs('/admin/astrologers', { status: s }), count: count(s) }))} />
      <FilterBar q={q} placeholder="Search name, skill or phone" hidden={{ status }} />
      <Table head={['Astrologer', 'Phone', 'Skills', 'Exp', 'Chat / Call / Video', 'Commission', 'Rating', status === 'PENDING' ? 'Applied' : 'Earnings', '']} empty={!rows.length}>
        {rows.map((a) => (
          <tr key={a.id}>
            <td>
              <Link href={`/admin/astrologers/${a.id}`} className="flex items-center gap-3">
                <Avatar name={a.displayName} src={a.avatar} size={36} online={a.status === 'APPROVED' ? a.isOnline && !a.isBusy : null} />
                <span>
                  <span className="block whitespace-nowrap font-semibold text-night-900 hover:text-saffron-700">{a.displayName}</span>
                  <span className="whitespace-nowrap text-xs text-muted">{a.city || '—'}{a.featured ? ' · ★ featured' : ''}{a.isBusy ? ' · in session' : ''}</span>
                </span>
              </Link>
            </td>
            <td className="tabular-nums">{a.user.phone}</td>
            <td className="max-w-[200px] truncate">{a.skills}</td>
            <td className="tabular-nums">{a.experience}y</td>
            <td className="whitespace-nowrap tabular-nums">{rupees(a.chatPrice)} / {rupees(a.callPrice)} / {rupees(a.videoPrice)}</td>
            <td className="tabular-nums">{a.commission}%</td>
            <td className="whitespace-nowrap"><Star className="mr-1 inline h-3.5 w-3.5 fill-gold-400 text-gold-400" />{a.rating.toFixed(1)} <span className="text-xs text-muted">({a.ratingCount})</span></td>
            <td className="whitespace-nowrap tabular-nums">{status === 'PENDING' ? fmtDate(a.createdAt) : rupees(a.earnings)}</td>
            <td className="text-right"><div className="flex justify-end gap-1.5"><AstroStatusActions id={a.id} status={a.status} compact /><Link href={`/admin/astrologers/${a.id}`} className="btn-ghost btn-sm">Edit</Link></div></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/astrologers" params={{ status, q }} />
      {status === 'APPROVED' && <p className="mt-2 text-xs text-muted"><Pill v="APPROVED" /> astrologers appear on the website. Green dot = online and free.</p>}
    </>
  );
}
