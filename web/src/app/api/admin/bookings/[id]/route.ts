import { db } from '@/lib/db';
import { walletMove } from '@/lib/wallet';
import { emitToUser } from '@/lib/realtime-bridge';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ['PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

export const PATCH = adminRoute(async (_admin, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const b = await body(req);
  const booking = await db.pujaBooking.findUnique({ where: { id }, include: { puja: true } });
  if (!booking) throw new HttpError(404, 'Booking not found.');

  const data: { status?: string; liveLink?: string | null; astrologerId?: string | null } = {};
  if (typeof b.liveLink === 'string') {
    const link = b.liveLink.trim();
    if (link && !/^https?:\/\//.test(link)) throw new HttpError(400, 'Live link must start with http(s)://');
    data.liveLink = link || null;
  }
  if ('astrologerId' in b) data.astrologerId = b.astrologerId ? String(b.astrologerId) : null;
  let refund = 0;
  if (typeof b.status === 'string' && b.status !== booking.status) {
    if (!STATUSES.includes(b.status)) throw new HttpError(400, 'Invalid status.');
    if (booking.status === 'CANCELLED') throw new HttpError(400, 'Cancelled bookings cannot be reopened.');
    if (b.status === 'CANCELLED' && ['CONFIRMED', 'COMPLETED'].includes(booking.status)) refund = booking.amount;
    data.status = b.status;
  }

  await db.pujaBooking.update({ where: { id }, data });
  if (refund > 0) {
    const balance = await walletMove(booking.userId, refund, 'REFUND', `Refund: ${booking.puja.name} booking cancelled`, booking.id);
    emitToUser(booking.userId, 'wallet:balance', { balance });
  }
  if (data.status || data.liveLink) {
    await db.notification.create({
      data: {
        userId: booking.userId,
        title: data.status ? `Puja booking ${data.status.toLowerCase().replace('_', ' ')}` : 'Live link added for your puja',
        body: `${booking.puja.name} on ${booking.date}${refund ? ` · ₹${refund / 100} refunded to wallet` : ''}`,
        link: '/account/orders',
      },
    });
  }
  return Response.json({ ok: true, refunded: refund });
});
