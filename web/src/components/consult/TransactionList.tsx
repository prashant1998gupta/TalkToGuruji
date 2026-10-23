import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Transaction } from '@prisma/client';
import { Pagination } from '@/components/ui/primitives';
import { cx, fmtDateTime, rupees } from '@/lib/format';

const LABEL: Record<string, string> = { RECHARGE: 'Recharge', CONSULT: 'Consultation', PUJA: 'Puja booking', ORDER: 'Astro Mart order', REFUND: 'Refund', BONUS: 'Bonus', EARNING: 'Earning', PAYOUT: 'Payout' };

export function TransactionList({ txs, page, pages, basePath }: { txs: Transaction[]; page: number; pages: number; basePath: string }) {
  if (!txs.length) return <p className="card mt-4 p-6 text-sm text-muted">No transactions yet.</p>;
  return (
    <>
      <ul className="card mt-4 divide-y divide-line overflow-hidden">
        {txs.map((t) => (
          <li key={t.id} className="flex items-center gap-3 px-4 py-3">
            <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-full', t.amount > 0 ? 'bg-leaf/10 text-leaf' : t.amount < 0 ? 'bg-rose/10 text-rose' : 'bg-cream-200 text-muted')}>
              {t.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{LABEL[t.type] || t.type}</p>
              <p className="truncate text-xs text-muted">{t.note} · {fmtDateTime(t.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className={cx('text-sm font-bold tabular-nums', t.amount > 0 ? 'text-leaf' : t.amount < 0 ? 'text-rose' : 'text-muted')}>
                {t.amount > 0 ? '+' : t.amount < 0 ? '−' : ''}{rupees(Math.abs(t.amount), { decimals: Math.abs(t.amount) % 100 !== 0 })}
              </p>
              <p className="text-[11px] text-muted">Bal {rupees(t.balanceAfter)}</p>
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={page} pages={pages} href={(p) => `${basePath}?page=${p}`} />
    </>
  );
}
