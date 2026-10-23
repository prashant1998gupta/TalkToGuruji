import { db } from '@/lib/db';
import { walletMove } from '@/lib/wallet';
import { emitToUser } from '@/lib/realtime-bridge';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ id: string }> };

// Allowed next states for each order state
const FLOW: Record<string, string[]> = {
  PENDING_PAYMENT: ['CANCELLED'],
  PLACED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export const PATCH = adminRoute(async (_admin, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const { status } = await body(req);
  const order = await db.order.findUnique({ where: { id } });
  if (!order) throw new HttpError(404, 'Order not found.');
  if (typeof status !== 'string' || !FLOW[order.status]?.includes(status)) throw new HttpError(400, `Cannot move an order from ${order.status} to ${status}.`);

  // claim the transition atomically so a double click can't refund twice
  const res = await db.order.updateMany({ where: { id, status: order.status }, data: { status } });
  if (res.count === 0) throw new HttpError(409, 'Order was changed by someone else. Refresh and try again.');

  let refunded = 0;
  if (status === 'CANCELLED' && order.status !== 'PENDING_PAYMENT') {
    refunded = order.amount;
    const balance = await walletMove(order.userId, refunded, 'REFUND', `Refund for cancelled order #${order.id.slice(-6).toUpperCase()}`, order.id);
    emitToUser(order.userId, 'wallet:balance', { balance });
  }
  await db.notification.create({
    data: {
      userId: order.userId,
      title: `Order ${status.toLowerCase()}`,
      body: `Order #${order.id.slice(-6).toUpperCase()}${refunded ? ` · ₹${refunded / 100} refunded to your wallet` : ''}`,
      link: '/account/orders',
    },
  });
  return Response.json({ ok: true, refunded });
});
