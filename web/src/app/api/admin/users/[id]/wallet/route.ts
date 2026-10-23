import { walletMove, InsufficientBalance } from '@/lib/wallet';
import { emitToUser } from '@/lib/realtime-bridge';
import { db } from '@/lib/db';
import { adminRoute, body, HttpError } from '@/components/admin/server-utils';

type Ctx = { params: Promise<{ id: string }> };

/** Credit (positive) or debit (negative) a user's wallet. Amount in rupees. */
export const POST = adminRoute(async (admin, req: Request, { params }: Ctx) => {
  const { id } = await params;
  const b = await body(req);
  const rupees = Number(b.amount);
  const note = String(b.note || '').trim();
  if (!Number.isFinite(rupees) || rupees === 0 || Math.abs(rupees) > 100000) throw new HttpError(400, 'Enter an amount between ₹1 and ₹1,00,000.');
  if (!note) throw new HttpError(400, 'A note is required for wallet adjustments.');
  const paise = Math.round(rupees * 100);
  try {
    const balance = await walletMove(id, paise, paise > 0 ? 'BONUS' : 'REFUND', `${note} (by admin ${admin.name || admin.phone})`);
    emitToUser(id, 'wallet:balance', { balance });
    await db.notification.create({ data: { userId: id, title: paise > 0 ? 'Wallet credited' : 'Wallet adjusted', body: `${paise > 0 ? '+' : '−'}₹${Math.abs(rupees)} · ${note}`, link: '/wallet' } });
    return Response.json({ ok: true, balance });
  } catch (e) {
    if (e instanceof InsufficientBalance) throw new HttpError(400, 'The user does not have enough balance for this debit.');
    throw e;
  }
});
