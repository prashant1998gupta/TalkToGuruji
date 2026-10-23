/**
 * Payment orders. Every paid flow (wallet recharge, puja booking, Astro Mart order)
 * creates a PaymentOrder and sends the user to /pay/[id]. In local mode that page is a
 * built-in test gateway; in production swap it for Razorpay checkout and call
 * fulfillPayment() from the verified webhook.
 */
import { db } from './db';
import { walletMove } from './wallet';
import { emitToUser } from './realtime-bridge';

export type Purpose = 'RECHARGE' | 'PUJA' | 'ORDER';

export async function createPaymentOrder(opts: { userId: string; amount: number; purpose: Purpose; refId?: string; credit?: number }) {
  const order = await db.paymentOrder.create({
    data: { userId: opts.userId, amount: opts.amount, credit: opts.credit ?? 0, purpose: opts.purpose, refId: opts.refId },
  });
  return { id: order.id, payUrl: `/pay/${order.id}` };
}

/** Mark an order paid and deliver what was bought. Idempotent. Returns where to send the user next. */
export async function fulfillPayment(orderId: string, method: string) {
  const order = await db.paymentOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Payment order not found');
  const next = nextUrl(order.purpose, order.refId);
  if (order.status === 'PAID') return { next, order };

  // claim the order atomically so double-clicks / retries can't fulfil twice
  const claimed = await db.paymentOrder.updateMany({ where: { id: orderId, status: { not: 'PAID' } }, data: { status: 'PAID', method } });
  if (claimed.count === 0) return { next, order };

  if (order.purpose === 'RECHARGE') {
    const balance = await walletMove(order.userId, order.credit, 'RECHARGE', `Wallet recharge via ${method}`, order.id);
    emitToUser(order.userId, 'wallet:balance', { balance });
    await db.notification.create({ data: { userId: order.userId, title: 'Wallet recharged', body: `₹${(order.credit / 100).toFixed(0)} added to your wallet.`, link: '/wallet' } });
  } else if (order.purpose === 'PUJA' && order.refId) {
    const b = await db.pujaBooking.update({ where: { id: order.refId }, data: { status: 'CONFIRMED' }, include: { puja: true } });
    await db.transaction.create({ data: { userId: order.userId, amount: 0, type: 'PUJA', note: `Paid ₹${(order.amount / 100).toFixed(0)} via ${method} for ${b.puja.name}`, refId: b.id, balanceAfter: (await db.user.findUniqueOrThrow({ where: { id: order.userId } })).walletBalance } });
    await db.notification.create({ data: { userId: order.userId, title: 'Puja booking confirmed', body: `${b.puja.name} on ${b.date} is confirmed.`, link: '/account/orders' } });
  } else if (order.purpose === 'ORDER' && order.refId) {
    const o = await db.order.update({ where: { id: order.refId }, data: { status: 'PLACED' } });
    const snap = JSON.parse(o.items) as { items?: { productId: string; qty: number }[] } | { productId: string; qty: number }[];
    for (const it of Array.isArray(snap) ? snap : snap.items || []) await db.product.updateMany({ where: { id: it.productId, stock: { gte: it.qty } }, data: { stock: { decrement: it.qty } } });
    await db.cartItem.deleteMany({ where: { userId: order.userId } });
    await db.notification.create({ data: { userId: order.userId, title: 'Order placed', body: 'Your Astro Mart order has been placed.', link: '/account/orders' } });
  }
  return { next, order };
}

export async function failPayment(orderId: string) {
  await db.paymentOrder.updateMany({ where: { id: orderId, status: 'CREATED' }, data: { status: 'FAILED' } });
}

/** Where to send the user after a successful payment. */
export function nextUrl(purpose: string, refId: string | null) {
  if (purpose === 'RECHARGE') return '/wallet?paid=1';
  if (purpose === 'PUJA') return `/account/orders?booking=${refId}`;
  return `/account/orders?order=${refId}`;
}

/** GST is added on top of recharge amounts, like most consultation apps (rate from admin Settings). */
export const withGst = (paise: number, gstPercent: number) => Math.round(paise * (1 + gstPercent / 100));
