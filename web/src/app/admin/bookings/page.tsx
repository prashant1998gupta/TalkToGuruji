import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDateTime, rupees } from '@/lib/format';
import { FilterBar, PageHeader, Pager, Pill, Table, Tabs, pageParam, qs } from '@/components/admin/ui';
import { BookingControls } from '@/components/admin/BookingControls';

export const metadata = { title: 'Puja bookings' };
const PER = 25;
const STATUSES = ['CONFIRMED', 'COMPLETED', 'PENDING_PAYMENT', 'CANCELLED'];

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status || '') ? sp.status! : 'CONFIRMED';
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const where: Prisma.PujaBookingWhereInput = {
    status,
    ...(q ? { OR: [{ devoteeName: { contains: q } }, { user: { phone: { contains: q } } }, { puja: { name: { contains: q } } }] } : {}),
  };
  const [rows, total, counts, astros] = await Promise.all([
    db.pujaBooking.findMany({ where, orderBy: status === 'CONFIRMED' ? { date: 'asc' } : { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, include: { puja: { select: { name: true } }, user: { select: { name: true, phone: true } } } }),
    db.pujaBooking.count({ where }),
    db.pujaBooking.groupBy({ by: ['status'], _count: true }),
    db.astrologer.findMany({ where: { status: 'APPROVED' }, select: { id: true, displayName: true }, orderBy: { displayName: 'asc' } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader title="Puja bookings" sub="Assign a pandit, add the live stream link and mark pujas complete. Cancelling a paid booking refunds the wallet." />
      <Tabs active={status} tabs={STATUSES.map((s) => ({ key: s, label: s === 'CONFIRMED' ? 'To perform' : s[0] + s.slice(1).toLowerCase().replace('_', ' '), href: qs('/admin/bookings', { status: s }), count: count(s) }))} />
      <FilterBar q={q} placeholder="Devotee, phone or puja" hidden={{ status }} />
      <Table head={['Puja date', 'Puja', 'Devotee', 'Booked by', 'Amount', 'Status', 'Manage']} empty={!rows.length}>
        {rows.map((b) => (
          <tr key={b.id}>
            <td className="whitespace-nowrap font-semibold">{b.date}<div className="text-xs font-normal text-muted">{b.mode.toLowerCase()}</div></td>
            <td className="max-w-[200px]"><span className="line-clamp-2">{b.puja.name}</span></td>
            <td>
              <span className="font-medium">{b.devoteeName}</span>
              <div className="text-xs text-muted">{[b.gotra && `Gotra ${b.gotra}`, b.purpose].filter(Boolean).join(' · ') || '—'}</div>
              {b.address && <div className="max-w-[220px] truncate text-xs text-muted" title={b.address}>{b.address}</div>}
            </td>
            <td><Link href={`/admin/users/${b.userId}`} className="hover:text-saffron-700">{b.user.name || b.user.phone}</Link><div className="text-xs text-muted">{fmtDateTime(b.createdAt)}</div></td>
            <td className="tabular-nums font-semibold">{rupees(b.amount)}</td>
            <td><Pill v={b.status} /></td>
            <td><BookingControls id={b.id} status={b.status} liveLink={b.liveLink || ''} astrologerId={b.astrologerId || ''} astrologers={astros} /></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/bookings" params={{ status, q }} />
    </>
  );
}
