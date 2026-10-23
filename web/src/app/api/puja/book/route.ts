import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPaymentOrder } from '@/lib/payments';
import { walletMove, InsufficientBalance } from '@/lib/wallet';

const schema = z
  .object({
    pujaId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mode: z.enum(['ONLINE', 'OFFLINE']),
    devoteeName: z.string().trim().min(2).max(80),
    gotra: z.string().trim().max(60).optional(),
    purpose: z.string().trim().max(300).optional(),
    address: z.string().trim().max(400).optional(),
    pay: z.enum(['wallet', 'online']),
  })
  .refine((d) => d.mode === 'ONLINE' || (d.address && d.address.length >= 10), { message: 'Please enter the full address for an offline puja.', path: ['address'] });

export async function POST(req: Request) {
  const user = await apiUser(['USER']);
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || 'Please check the booking details.' }, { status: 400 });
  const d = parsed.data;

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const max = new Date(tomorrow);
  max.setDate(max.getDate() + 180);
  const when = new Date(d.date + 'T00:00:00');
  if (when < tomorrow || when > max) return Response.json({ error: 'Choose a date between tomorrow and the next 6 months.' }, { status: 400 });

  const puja = await db.puja.findUnique({ where: { id: d.pujaId } });
  if (!puja || !puja.active) return Response.json({ error: 'This puja is not available right now.' }, { status: 404 });
  const amount = puja.price * 100;

  const booking = await db.pujaBooking.create({
    data: {
      pujaId: puja.id, userId: user.id, date: d.date, mode: d.mode, devoteeName: d.devoteeName, gotra: d.gotra || null,
      purpose: d.purpose || null, address: d.mode === 'OFFLINE' ? d.address : null, amount,
    },
  });

  if (d.pay === 'online') {
    const { payUrl } = await createPaymentOrder({ userId: user.id, amount, purpose: 'PUJA', refId: booking.id });
    return Response.json({ ok: true, bookingId: booking.id, payUrl });
  }

  try {
    const balance = await db.$transaction(async (tx) => {
      const bal = await walletMove(user.id, -amount, 'PUJA', `${puja.name} on ${d.date}`, booking.id, tx);
      await tx.pujaBooking.update({ where: { id: booking.id }, data: { status: 'CONFIRMED' } });
      await tx.notification.create({ data: { userId: user.id, title: 'Puja booking confirmed', body: `${puja.name} on ${d.date} is confirmed.`, link: '/account/orders' } });
      return bal;
    });
    return Response.json({ ok: true, bookingId: booking.id, balance, next: `/account/orders?booking=${booking.id}` });
  } catch (e) {
    await db.pujaBooking.delete({ where: { id: booking.id } });
    if (e instanceof InsufficientBalance) {
      return Response.json({ error: `Your wallet balance (₹${Math.floor(user.walletBalance / 100)}) is not enough. Pay online or recharge your wallet.`, code: 'LOW_BALANCE' }, { status: 402 });
    }
    throw e;
  }
}
