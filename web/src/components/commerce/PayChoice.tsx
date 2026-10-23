'use client';

import { CreditCard, Wallet } from 'lucide-react';
import { cx, rupees } from '@/lib/format';

/** Wallet vs online gateway selector used by puja booking and checkout. */
export function PayChoice({ value, onChange, balance, amount }: { value: 'wallet' | 'online'; onChange: (v: 'wallet' | 'online') => void; balance: number; amount: number }) {
  const enough = balance >= amount;
  const opt = (v: 'wallet' | 'online', icon: React.ReactNode, title: string, sub: string, disabled?: boolean) => (
    <label className={cx('flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition', value === v ? 'border-saffron-400 bg-saffron-50 ring-4 ring-saffron-100' : 'border-line bg-white hover:border-saffron-200', disabled && 'cursor-not-allowed opacity-50')}>
      <input type="radio" name="pay" className="sr-only" checked={value === v} disabled={disabled} onChange={() => onChange(v)} />
      <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', value === v ? 'bg-saffron-500 text-white' : 'bg-cream-200 text-ink/70')}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{sub}</span>
      </span>
      <span className={cx('h-4 w-4 rounded-full border-2', value === v ? 'border-saffron-500 bg-saffron-500 shadow-[inset_0_0_0_2px_white]' : 'border-line')} />
    </label>
  );
  return (
    <div className="grid gap-2.5">
      {opt('wallet', <Wallet className="h-5 w-5" />, 'Pay from wallet', enough ? `Balance ${rupees(balance)}` : `Balance ${rupees(balance)} — not enough`, !enough)}
      {opt('online', <CreditCard className="h-5 w-5" />, 'Pay online', 'UPI, cards, net banking')}
    </div>
  );
}
