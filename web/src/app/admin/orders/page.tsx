import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDateTime, json, rupees } from '@/lib/format';
import { ActionButton } from '@/components/admin/client';
import { FilterBar, PageHeader, Pager, Pill, Table, Tabs, pageParam, qs } from '@/components/admin/ui';

export const metadata = { title: 'Orders' };
const PER = 25;
const STATUSES = ['PLACED', 'SHIPPED', 'DELIVERED', 'PENDING_PAYMENT', 'CANCELLED'];

type Item = { name?: string; variant?: string; qty?: number; price?: number };
type Address = { name?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; pincode?: string };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status || '') ? sp.status! : 'PLACED';
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const where: Prisma.OrderWhereInput = { status, ...(q ? { OR: [{ id: { contains: q } }, { user: { phone: { contains: q } } }] } : {}) };
  const [rows, total, counts] = await Promise.all([
    db.order.findMany({ where, orderBy: { createdAt: status === 'PLACED' ? 'asc' : 'desc' }, skip: (page - 1) * PER, take: PER, include: { user: { select: { name: true, phone: true } } } }),
    db.order.count({ where }),
    db.order.groupBy({ by: ['status'], _count: true }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count ?? 0;

  return (
    <>
      <PageHeader title="Orders" sub="Astro Mart orders. Cancelling a paid order refunds the user’s wallet." />
      <Tabs active={status} tabs={STATUSES.map((s) => ({ key: s, label: s === 'PLACED' ? 'To ship' : s[0] + s.slice(1).toLowerCase().replace('_', ' '), href: qs('/admin/orders', { status: s }), count: count(s) }))} />
      <FilterBar q={q} placeholder="Order id or phone" hidden={{ status }} />
      <Table head={['Order', 'Customer', 'Items', 'Ship to', 'Amount', 'Status', 'Actions']} empty={!rows.length}>
        {rows.map((o) => {
          const parsed = json<Item[] | { items?: Item[]; shipping?: number }>(o.items, []);
          const items = Array.isArray(parsed) ? parsed : parsed.items || [];
          const a = json<Address>(o.address, {});
          const url = `/api/admin/orders/${o.id}`;
          return (
            <tr key={o.id}>
              <td className="whitespace-nowrap"><b className="font-mono">#{o.id.slice(-6).toUpperCase()}</b><div className="text-xs text-muted">{fmtDateTime(o.createdAt)}</div></td>
              <td><Link href={`/admin/users/${o.userId}`} className="hover:text-saffron-700">{o.user.name || o.user.phone}</Link></td>
              <td className="max-w-[240px] text-xs">
                {items.map((it, i) => <div key={i} className="truncate">{it.qty || 1}× {it.name}{it.variant ? ` (${it.variant})` : ''}</div>)}
              </td>
              <td className="max-w-[220px] text-xs text-muted">
                <div className="font-medium text-ink">{a.name}{a.phone ? ` · ${a.phone}` : ''}</div>
                <div className="truncate">{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</div>
              </td>
              <td className="tabular-nums font-semibold">{rupees(o.amount)}</td>
              <td><Pill v={o.status} /></td>
              <td className="whitespace-nowrap">
                <div className="flex gap-1.5">
                  {o.status === 'PLACED' && <ActionButton url={url} payload={{ status: 'SHIPPED' }} success="Marked shipped" className="btn-dark btn-sm">Mark shipped</ActionButton>}
                  {o.status === 'SHIPPED' && <ActionButton url={url} payload={{ status: 'DELIVERED' }} success="Marked delivered" className="btn-dark btn-sm">Mark delivered</ActionButton>}
                  {['PLACED', 'SHIPPED', 'PENDING_PAYMENT'].includes(o.status) && (
                    <ActionButton url={url} payload={{ status: 'CANCELLED' }} success="Order cancelled" danger confirm={o.status === 'PENDING_PAYMENT' ? 'Cancel this unpaid order?' : `Cancel and refund ${rupees(o.amount)} to the customer’s wallet?`}>Cancel</ActionButton>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/orders" params={{ status, q }} />
    </>
  );
}
