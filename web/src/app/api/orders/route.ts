import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPaymentOrder } from '@/lib/payments';
import { walletMove, InsufficientBalance } from '@/lib/wallet';
import { loadCart } from '@/components/commerce/cart';

const schema = z.object({
  address: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number.'),
    line1: z.string().trim().min(5).max(200),
    line2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode.'),
  }),
  pay: z.enum(['wallet', 'online']),
});

export async function POST(req: Request) {
  const user = await apiUser(['USER']);
  if (user instanceof Response) return user;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message || 'Please complete the delivery address.' }, { status: 400 });
  const { address, pay } = parsed.data;

  const cart = await loadCart(user.id);
  if (!cart.lines.length) return Response.json({ error: 'Your cart is empty.' }, { status: 400 });
  const short = cart.lines.find((l) => l.qty > l.stock);
  if (short) return Response.json({ error: `Only ${short.stock} left of ${short.name}.` }, { status: 409 });

  const amount = cart.total * 100;
  const items = cart.lines.map(({ productId, slug, name, image, variant, price, qty }) => ({ productId, slug, name, image, variant, price, qty }));
  const order = await db.order.create({ data: { userId: user.id, items: JSON.stringify({ items, subtotal: cart.subtotal, shipping: cart.shipping, total: cart.total }), amount, address: JSON.stringify(address) } });

  if (pay === 'online') {
    const { payUrl } = await createPaymentOrder({ userId: user.id, amount, purpose: 'ORDER', refId: order.id });
    return Response.json({ ok: true, orderId: order.id, payUrl });
  }

  try {
    await db.$transaction(async (tx) => {
      await walletMove(user.id, -amount, 'ORDER', `Astro Mart order #${order.id.slice(-6).toUpperCase()}`, order.id, tx);
      await tx.order.update({ where: { id: order.id }, data: { status: 'PLACED' } });
      await tx.cartItem.deleteMany({ where: { userId: user.id } });
      for (const l of cart.lines) await tx.product.update({ where: { id: l.productId }, data: { stock: { decrement: l.qty } } });
      await tx.notification.create({ data: { userId: user.id, title: 'Order placed', body: 'Your Astro Mart order has been placed.', link: '/account/orders' } });
    });
    return Response.json({ ok: true, orderId: order.id, next: `/account/orders?order=${order.id}` });
  } catch (e) {
    await db.order.delete({ where: { id: order.id } });
    if (e instanceof InsufficientBalance) return Response.json({ error: 'Your wallet balance is not enough. Pay online or recharge your wallet.', code: 'LOW_BALANCE' }, { status: 402 });
    throw e;
  }
}
