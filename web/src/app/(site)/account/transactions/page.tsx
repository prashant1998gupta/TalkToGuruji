import type { Metadata } from 'next';
import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { TransactionList } from '@/components/consult/TransactionList';
import { rupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Transactions', robots: { index: false } };

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const u = await requireUser(undefined, '/account/transactions');
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [txs, total, payments] = await Promise.all([
    db.transaction.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 20, take: 20 }),
    db.transaction.count({ where: { userId: u.id } }),
    db.paymentOrder.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 8 }),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold">Wallet transactions</h1>
          <Link href="/wallet" className="btn-primary btn-sm">Add money</Link>
        </div>
        <TransactionList txs={txs} page={page} pages={Math.ceil(total / 20)} basePath="/account/transactions" />
      </div>
      {payments.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold">Recent payments</h2>
          <ul className="card mt-4 divide-y divide-line">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span><b>{p.purpose === 'RECHARGE' ? 'Wallet recharge' : p.purpose === 'PUJA' ? 'Puja booking' : 'Astro Mart order'}</b><span className="block text-xs text-muted">#{p.id.slice(-8).toUpperCase()} · {p.createdAt.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}{p.method ? ` · ${p.method}` : ''}</span></span>
                <span className="text-right">
                  <b className="tabular-nums">{rupees(p.amount, { decimals: p.amount % 100 !== 0 })}</b>
                  <span className={`block text-[11px] font-bold ${p.status === 'PAID' ? 'text-leaf' : p.status === 'FAILED' ? 'text-rose' : 'text-saffron-600'}`}>
                    {p.status === 'CREATED' ? <Link href={`/pay/${p.id}`} className="underline">Pending — pay now</Link> : p.status.toLowerCase()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">Current balance: {rupees(u.walletBalance)}</p>
        </div>
      )}
    </div>
  );
}
