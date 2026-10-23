import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { isLocalMode } from '@/lib/config';
import { failPayment, fulfillPayment } from '@/lib/payments';

const schema = z.object({ result: z.enum(['success', 'failure']), method: z.string().max(30).default('UPI') });

/** Local test gateway callback. In production this is replaced by a verified Razorpay webhook. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isLocalMode()) return Response.json({ error: 'Test gateway is disabled.' }, { status: 403 });
  const u = await apiUser();
  if (u instanceof Response) return u;
  const { id } = await params;
  const order = await db.paymentOrder.findUnique({ where: { id } });
  if (!order || order.userId !== u.id) return Response.json({ error: 'Payment not found.' }, { status: 404 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Bad request.' }, { status: 400 });

  if (parsed.data.result === 'failure') {
    if (order.status === 'PAID') return Response.json({ error: 'This order is already paid.' }, { status: 409 });
    await failPayment(id);
    return Response.json({ ok: false, status: 'FAILED' });
  }
  const { next } = await fulfillPayment(id, parsed.data.method);
  return Response.json({ ok: true, status: 'PAID', next });
}
