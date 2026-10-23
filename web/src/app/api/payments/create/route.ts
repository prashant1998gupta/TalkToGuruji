import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { createPaymentOrder, withGst } from '@/lib/payments';
import { getGstPercent } from '@/lib/settings';

const schema = z.object({ purpose: z.literal('RECHARGE'), packId: z.string().optional(), amount: z.number().int().min(50).max(100000).optional() });

/** Starts a wallet recharge. Puja & store orders create their payment orders server-side. */
export async function POST(req: Request) {
  const u = await apiUser(['USER']);
  if (u instanceof Response) return u;
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Minimum recharge is ₹50 (maximum ₹1,00,000).' }, { status: 400 });

  let rupees = parsed.data.amount ?? 0;
  let bonus = 0;
  if (parsed.data.packId) {
    const pack = await db.rechargePack.findUnique({ where: { id: parsed.data.packId } });
    if (!pack) return Response.json({ error: 'Recharge pack not found.' }, { status: 404 });
    rupees = pack.amount;
    bonus = pack.bonus;
  }
  if (rupees < 50) return Response.json({ error: 'Minimum recharge is ₹50.' }, { status: 400 });
  const base = rupees * 100;
  const { payUrl } = await createPaymentOrder({ userId: u.id, amount: withGst(base, await getGstPercent()), credit: base + Math.round((base * bonus) / 100), purpose: 'RECHARGE' });
  return Response.json({ payUrl });
}
