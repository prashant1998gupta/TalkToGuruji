import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDateTime, rupees } from '@/lib/format';
import { FilterBar, PageHeader, Pager, Pill, Select, Table, pageParam } from '@/components/admin/ui';

export const metadata = { title: 'Consultations' };
const PER = 30;

export default async function ConsultationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const from = sp.from ? new Date(sp.from) : null;
  const to = sp.to ? new Date(new Date(sp.to).getTime() + 86400000) : null;
  const where: Prisma.ConsultSessionWhereInput = {
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.type ? { type: sp.type } : {}),
    ...(sp.astrologer ? { astrologerId: sp.astrologer } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
    ...(q ? { OR: [{ user: { phone: { contains: q } } }, { user: { name: { contains: q } } }, { id: { contains: q } }] } : {}),
  };
  const [rows, total, astros, sums] = await Promise.all([
    db.consultSession.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, include: { user: { select: { name: true, phone: true } }, astrologer: { select: { displayName: true, commission: true } } } }),
    db.consultSession.count({ where }),
    db.astrologer.findMany({ where: { status: { in: ['APPROVED', 'SUSPENDED'] } }, select: { id: true, displayName: true }, orderBy: { displayName: 'asc' } }),
    db.consultSession.aggregate({ where, _sum: { amount: true, billedMinutes: true } }),
  ]);

  return (
    <>
      <PageHeader title="Consultations" sub={<>{total} sessions · {(sums._sum.billedMinutes || 0).toLocaleString('en-IN')} minutes · {rupees(sums._sum.amount || 0)} billed</>} />
      <FilterBar q={q} placeholder="User phone, name or session id">
        <Select name="status" value={sp.status} label="Status" options={[['', 'All statuses'], ...['ACTIVE', 'ENDED', 'REQUESTED', 'MISSED', 'REJECTED', 'CANCELLED'].map((s) => [s, s[0] + s.slice(1).toLowerCase()] as [string, string])]} />
        <Select name="type" value={sp.type} label="Type" options={[['', 'All types'], ['CHAT', 'Chat'], ['CALL', 'Call'], ['VIDEO', 'Video']]} />
        <Select name="astrologer" value={sp.astrologer} label="Astrologer" options={[['', 'All astrologers'], ...astros.map((a) => [a.id, a.displayName] as [string, string])]} />
        <input type="date" name="from" defaultValue={sp.from} className="input !w-auto" aria-label="From date" />
        <input type="date" name="to" defaultValue={sp.to} className="input !w-auto" aria-label="To date" />
      </FilterBar>
      <Table head={['Started', 'User', 'Astrologer', 'Type', 'Rate', 'Minutes', 'Charged', 'Astro share', 'Status']} empty={!rows.length}>
        {rows.map((s) => (
          <tr key={s.id}>
            <td className="whitespace-nowrap"><Link href={`/admin/consultations/${s.id}`} className="font-medium text-saffron-700 hover:underline">{fmtDateTime(s.createdAt)}</Link></td>
            <td>{s.user.name || s.user.phone}</td>
            <td>{s.astrologer.displayName}</td>
            <td>{s.type}</td>
            <td className="tabular-nums">{rupees(s.ratePerMin)}/m</td>
            <td className="tabular-nums">{s.billedMinutes}{s.freeMinutes ? <span className="text-xs text-leaf"> ({s.freeMinutes} free)</span> : null}</td>
            <td className="tabular-nums font-semibold">{rupees(s.amount)}</td>
            <td className="tabular-nums">{rupees(Math.floor((s.amount * (100 - s.astrologer.commission)) / 100))}</td>
            <td><Pill v={s.status} /></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/consultations" params={{ q, status: sp.status, type: sp.type, astrologer: sp.astrologer, from: sp.from, to: sp.to }} />
    </>
  );
}
