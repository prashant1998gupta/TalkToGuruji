import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isLocalMode } from '@/lib/config';
import { json } from '@/lib/format';
import { nextUrl } from '@/lib/payments';
import { TestCheckout } from '@/components/consult/TestCheckout';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Secure checkout', robots: { index: false } };

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(undefined, `/pay/${id}`);
  const order = await db.paymentOrder.findUnique({ where: { id } });
  if (!order || order.userId !== user.id) notFound();

  let title = 'Wallet recharge';
  let lines: { label: string; value: number }[] = [];
  let back = '/wallet';
  if (order.purpose === 'RECHARGE') {
    const base = Math.round(order.amount / 1.18);
    lines = [{ label: 'Recharge amount', value: base }, { label: 'GST (18%)', value: order.amount - base }];
    if (order.credit > base) lines.push({ label: `Wallet credit (incl. ₹${((order.credit - base) / 100).toFixed(0)} bonus)`, value: -1 });
  } else if (order.purpose === 'PUJA' && order.refId) {
    const b = await db.pujaBooking.findUnique({ where: { id: order.refId }, include: { puja: true } });
    title = b ? b.puja.name : 'Puja booking';
    lines = [{ label: b ? `Puja on ${b.date} · ${b.mode.toLowerCase()}` : 'Puja', value: order.amount }];
    back = b ? `/puja/${b.puja.slug}` : '/astrology-services/online-pooja-booking';
  } else if (order.purpose === 'ORDER' && order.refId) {
    const o = await db.order.findUnique({ where: { id: order.refId } });
    title = 'Astro Mart order';
    const items = json<{ name: string; qty: number; price: number; variant?: string }[]>(o?.items, []);
    lines = items.map((i) => ({ label: `${i.name}${i.variant ? ` (${i.variant})` : ''} × ${i.qty || 1}`, value: Math.round(Number(i.price) * (i.qty || 1) * 100) }));
    // item shape is owned by the store; fall back to a single total if it doesn't add up
    if (!lines.length || lines.some((l) => !Number.isFinite(l.value)) || lines.reduce((s, l) => s + l.value, 0) !== order.amount) lines = [{ label: `${items.length || 1} item(s) incl. shipping & taxes`, value: order.amount }];
    back = '/cart';
  }

  return (
    <TestCheckout
      order={{ id: order.id, amount: order.amount, credit: order.credit, status: order.status, purpose: order.purpose }}
      title={title}
      lines={lines}
      back={back}
      next={nextUrl(order.purpose, order.refId)}
      phone={user.phone}
      enabled={isLocalMode()}
    />
  );
}
