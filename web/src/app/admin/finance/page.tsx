import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDateTime, rupees } from '@/lib/format';
import { FilterBar, PageHeader, Pager, Pill, Select, Stat, Table, Tabs, pageParam, qs } from '@/components/admin/ui';
import { CrudTable } from '@/components/admin/CrudTable';

export const metadata = { title: 'Finance' };
const PER = 30;
const TABS = [
  { key: 'payments', label: 'Payment orders' },
  { key: 'ledger', label: 'Wallet ledger' },
  { key: 'earnings', label: 'Astrologer earnings' },
  { key: 'packs', label: 'Recharge packs' },
];

export default async function FinancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const tab = TABS.some((t) => t.key === sp.tab) ? sp.tab! : 'payments';
  const page = pageParam(sp.page);
  const q = sp.q?.trim();

  const [paid, walletFloat, consultBilled, payouts] = await Promise.all([
    db.paymentOrder.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: true }),
    db.user.aggregate({ _sum: { walletBalance: true } }),
    db.transaction.aggregate({ where: { type: 'CONSULT' }, _sum: { amount: true } }),
    db.astrologer.aggregate({ _sum: { earnings: true } }),
  ]);

  return (
    <>
      <PageHeader title="Finance" sub="All amounts include GST where charged." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Payments received" value={rupees(paid._sum.amount || 0)} hint={`${paid._count} paid orders`} tone="good" />
        <Stat label="Wallet balances (liability)" value={rupees(walletFloat._sum.walletBalance || 0)} />
        <Stat label="Consultation billing" value={rupees(Math.abs(consultBilled._sum.amount || 0))} />
        <Stat label="Owed to astrologers" value={rupees(payouts._sum.earnings || 0)} />
      </div>
      <Tabs active={tab} tabs={TABS.map((t) => ({ ...t, href: qs('/admin/finance', { tab: t.key }) }))} />
      {tab === 'payments' && <Payments sp={sp} page={page} q={q} />}
      {tab === 'ledger' && <Ledger sp={sp} page={page} q={q} />}
      {tab === 'earnings' && <Earnings />}
      {tab === 'packs' && <CrudTable entity="rechargePack" rows={await db.rechargePack.findMany({ orderBy: { sort: 'asc' } })} newDefaults={{ bonus: 0, sort: 10, popular: false }} />}
    </>
  );
}

async function Payments({ sp, page, q }: { sp: Record<string, string | undefined>; page: number; q?: string }) {
  const where: Prisma.PaymentOrderWhereInput = {
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.purpose ? { purpose: sp.purpose } : {}),
    ...(q ? { OR: [{ id: { contains: q } }, { user: { phone: { contains: q } } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.paymentOrder.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, include: { user: { select: { name: true, phone: true } } } }),
    db.paymentOrder.count({ where }),
  ]);
  return (
    <>
      <FilterBar q={q} placeholder="Order id or phone" hidden={{ tab: 'payments' }}>
        <Select name="status" value={sp.status} label="Status" options={[['', 'All statuses'], ['PAID', 'Paid'], ['CREATED', 'Created'], ['FAILED', 'Failed']]} />
        <Select name="purpose" value={sp.purpose} label="Purpose" options={[['', 'All purposes'], ['RECHARGE', 'Recharge'], ['PUJA', 'Puja'], ['ORDER', 'Order']]} />
      </FilterBar>
      <Table head={['Created', 'Order', 'User', 'Purpose', 'Amount', 'Wallet credit', 'Method', 'Status']} empty={!rows.length}>
        {rows.map((p) => (
          <tr key={p.id}>
            <td className="whitespace-nowrap text-muted">{fmtDateTime(p.createdAt)}</td>
            <td className="font-mono text-xs">{p.id.slice(-10)}</td>
            <td><Link href={`/admin/users/${p.userId}`} className="hover:text-saffron-700">{p.user.name || p.user.phone}</Link></td>
            <td>{p.purpose}</td>
            <td className="tabular-nums font-semibold">{rupees(p.amount)}</td>
            <td className="tabular-nums">{p.credit ? rupees(p.credit) : '—'}</td>
            <td>{p.method || '—'}</td>
            <td><Pill v={p.status} /></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/finance" params={{ tab: 'payments', q, status: sp.status, purpose: sp.purpose }} />
    </>
  );
}

async function Ledger({ sp, page, q }: { sp: Record<string, string | undefined>; page: number; q?: string }) {
  const where: Prisma.TransactionWhereInput = {
    ...(sp.type ? { type: sp.type } : {}),
    ...(q ? { OR: [{ user: { phone: { contains: q } } }, { note: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.transaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, include: { user: { select: { name: true, phone: true } } } }),
    db.transaction.count({ where }),
  ]);
  return (
    <>
      <FilterBar q={q} placeholder="Phone or note" hidden={{ tab: 'ledger' }}>
        <Select name="type" value={sp.type} label="Type" options={[['', 'All types'], ...['RECHARGE', 'CONSULT', 'PUJA', 'ORDER', 'REFUND', 'BONUS'].map((t) => [t, t[0] + t.slice(1).toLowerCase()] as [string, string])]} />
      </FilterBar>
      <Table head={['When', 'User', 'Type', 'Note', 'Amount', 'Balance after']} empty={!rows.length}>
        {rows.map((t) => (
          <tr key={t.id}>
            <td className="whitespace-nowrap text-muted">{fmtDateTime(t.createdAt)}</td>
            <td><Link href={`/admin/users/${t.userId}`} className="hover:text-saffron-700">{t.user.name || t.user.phone}</Link></td>
            <td><Pill v={t.type} /></td>
            <td className="max-w-sm truncate">{t.note}</td>
            <td className={`tabular-nums font-semibold ${t.amount < 0 ? 'text-rose' : 'text-leaf'}`}>{t.amount < 0 ? '−' : '+'}{rupees(Math.abs(t.amount))}</td>
            <td className="tabular-nums">{rupees(t.balanceAfter)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/finance" params={{ tab: 'ledger', q, type: sp.type }} />
    </>
  );
}

async function Earnings() {
  const astros = await db.astrologer.findMany({ where: { status: { not: 'PENDING' } }, orderBy: { earnings: 'desc' }, select: { id: true, displayName: true, commission: true, earnings: true, totalMinutes: true, status: true } });
  const billed = await db.consultSession.groupBy({ by: ['astrologerId'], where: { status: 'ENDED' }, _sum: { amount: true, billedMinutes: true }, _count: true });
  const b = Object.fromEntries(billed.map((x) => [x.astrologerId, x]));
  return (
    <Table head={['Astrologer', 'Status', 'Sessions', 'Billed minutes', 'Gross billing', 'Commission', 'Platform share', 'Astrologer earnings']} empty={!astros.length}>
      {astros.map((a) => {
        const gross = b[a.id]?._sum.amount || 0;
        return (
          <tr key={a.id}>
            <td><Link href={`/admin/astrologers/${a.id}`} className="font-semibold hover:text-saffron-700">{a.displayName}</Link></td>
            <td><Pill v={a.status} /></td>
            <td className="tabular-nums">{b[a.id]?._count || 0}</td>
            <td className="tabular-nums">{b[a.id]?._sum.billedMinutes || 0}</td>
            <td className="tabular-nums">{rupees(gross)}</td>
            <td className="tabular-nums">{a.commission}%</td>
            <td className="tabular-nums">{rupees(Math.max(0, gross - a.earnings))}</td>
            <td className="tabular-nums font-semibold text-leaf">{rupees(a.earnings)}</td>
          </tr>
        );
      })}
    </Table>
  );
}
