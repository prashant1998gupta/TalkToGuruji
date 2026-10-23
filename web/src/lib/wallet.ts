import type { Prisma } from '@prisma/client';
import { db } from './db';

type Tx = Prisma.TransactionClient;

export class InsufficientBalance extends Error {
  constructor() { super('Insufficient wallet balance'); }
}

/**
 * Atomically move money in/out of a user's wallet and write the ledger row.
 * amount is in paise: positive = credit, negative = debit.
 */
export async function walletMove(userId: string, amount: number, type: string, note: string, refId?: string, tx?: Tx) {
  const run = async (t: Tx) => {
    if (amount < 0) {
      // conditional decrement guards against races
      const res = await t.user.updateMany({ where: { id: userId, walletBalance: { gte: -amount } }, data: { walletBalance: { increment: amount } } });
      if (res.count === 0) throw new InsufficientBalance();
    } else {
      await t.user.update({ where: { id: userId }, data: { walletBalance: { increment: amount } } });
    }
    const u = await t.user.findUniqueOrThrow({ where: { id: userId }, select: { walletBalance: true } });
    await t.transaction.create({ data: { userId, amount, type, note, refId, balanceAfter: u.walletBalance } });
    return u.walletBalance;
  };
  return tx ? run(tx) : db.$transaction(run);
}
