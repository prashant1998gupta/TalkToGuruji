'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, CreditCard, Loader2, Lock, QrCode, Smartphone, XCircle } from 'lucide-react';
import { LogoMark } from '@/components/brand/Logo';
import { useApp } from '@/components/providers/AppProvider';
import { cx, rupees } from '@/lib/format';

type Props = {
  order: { id: string; amount: number; credit: number; status: string; purpose: string };
  title: string;
  lines: { label: string; value: number }[];
  back: string;
  next: string;
  phone: string;
  enabled: boolean;
};

const METHODS = [
  { id: 'UPI', label: 'UPI', icon: Smartphone },
  { id: 'CARD', label: 'Card', icon: CreditCard },
  { id: 'NETBANKING', label: 'Netbanking', icon: Building2 },
] as const;

/** Local TEST payment gateway. Mimics a real checkout so every paid flow can be exercised end to end. */
export function TestCheckout({ order, title, lines, back, next, phone, enabled }: Props) {
  const router = useRouter();
  const { refresh } = useApp();
  const [method, setMethod] = useState<(typeof METHODS)[number]['id']>('UPI');
  const [busy, setBusy] = useState<'success' | 'failure' | null>(null);
  const [result, setResult] = useState<'PAID' | 'FAILED' | null>(order.status === 'PAID' ? 'PAID' : null);
  const [err, setErr] = useState('');
  const [bank, setBank] = useState('Test Bank of India');

  const complete = async (outcome: 'success' | 'failure') => {
    setBusy(outcome);
    setErr('');
    await new Promise((r) => setTimeout(r, 900)); // feels like a real gateway round-trip
    const r = await fetch(`/api/payments/${order.id}/complete`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ result: outcome, method }) });
    const j = await r.json();
    setBusy(null);
    if (!r.ok) return setErr(j.error || 'Payment could not be processed.');
    if (j.status === 'PAID') {
      setResult('PAID');
      await refresh();
    } else setResult('FAILED');
  };

  // also covers landing here on an already-paid order (reload, back button)
  useEffect(() => {
    if (result !== 'PAID') return;
    const t = setTimeout(() => router.replace(next), 1200);
    return () => clearTimeout(t);
  }, [result, next, router]);

  return (
    <div className="min-h-dvh bg-[linear-gradient(160deg,#120e24_0%,#1c1640_45%,#fbf6ee_45.1%)] px-4 py-6 sm:py-12">
      <div className="mx-auto max-w-[880px]">
        <div className="mb-5 flex items-center justify-between text-white">
          <Link href={back} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back</Link>
          <span className="flex items-center gap-1.5 text-xs text-white/60"><Lock className="h-3.5 w-3.5" /> Secured checkout</span>
        </div>
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-gold-300 px-4 py-2.5 text-sm font-semibold text-night-900">
          <AlertTriangle className="h-4 w-4 shrink-0" /> Test mode — no real money is charged. Use the buttons below to simulate a payment.
        </div>

        <div className="grid overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-[1fr_1.25fr]">
          {/* summary */}
          <aside className="night p-6 sm:p-8">
            <div className="flex items-center gap-2.5">
              <LogoMark className="h-10 w-10" />
              <div>
                <p className="font-display text-lg font-semibold">Talk to Guruji</p>
                <p className="text-xs text-white/50">Inno-one Service LLP</p>
              </div>
            </div>
            <p className="mt-8 text-xs uppercase tracking-[0.18em] text-white/50">Paying for</p>
            <p className="mt-1 font-display text-xl font-semibold">{title}</p>
            <dl className="mt-5 space-y-2 text-sm">
              {lines.map((l) => (
                <div key={l.label} className="flex justify-between gap-3">
                  <dt className="text-white/65">{l.label}</dt>
                  <dd className="tabular-nums">{l.value >= 0 ? rupees(l.value, { decimals: l.value % 100 !== 0 }) : rupees(order.credit)}</dd>
                </div>
              ))}
            </dl>
            <div className="gold-rule my-5" />
            <div className="flex items-end justify-between">
              <span className="text-sm text-white/65">Amount payable</span>
              <span className="font-display text-3xl font-semibold text-gold-300 tabular-nums" data-testid="pay-amount">{rupees(order.amount, { decimals: order.amount % 100 !== 0 })}</span>
            </div>
            <p className="mt-6 text-xs text-white/45">Order #{order.id.slice(-8).toUpperCase()} · +91 {phone}</p>
          </aside>

          {/* methods */}
          <section className="p-6 sm:p-8">
            {result === 'PAID' ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="h-16 w-16 text-leaf" />
                <p className="mt-4 font-display text-2xl font-semibold">Payment successful</p>
                <p className="mt-1 text-sm text-muted">Redirecting you back…</p>
              </div>
            ) : result === 'FAILED' ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <XCircle className="h-16 w-16 text-rose" />
                <p className="mt-4 font-display text-2xl font-semibold">Payment failed</p>
                <p className="mt-1 max-w-xs text-sm text-muted">No money was deducted. You can try again or choose another method.</p>
                <div className="mt-6 flex gap-2">
                  <button type="button" onClick={() => setResult(null)} className="btn-primary">Try again</button>
                  <Link href={back} className="btn-ghost">Cancel</Link>
                </div>
              </div>
            ) : (
              <>
                <p className="font-semibold">Choose a payment method</p>
                <div className="mt-3 grid grid-cols-3 gap-2" role="tablist">
                  {METHODS.map(({ id, label, icon: I }) => (
                    <button key={id} type="button" role="tab" aria-selected={method === id} onClick={() => setMethod(id)} className={cx('flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-xs font-semibold transition', method === id ? 'border-saffron-500 bg-saffron-50 text-saffron-700' : 'border-line text-ink/70 hover:border-saffron-200')}>
                      <I className="h-5 w-5" /> {label}
                    </button>
                  ))}
                </div>

                <div className="mt-5 min-h-[190px]">
                  {method === 'UPI' && (
                    <div className="flex gap-4">
                      <div className="grid h-32 w-32 shrink-0 place-items-center rounded-2xl bg-cream-100 ring-1 ring-line"><QrCode className="h-20 w-20 text-night-900/80" /></div>
                      <div className="flex-1">
                        <label className="label">UPI ID</label>
                        <input className="input" defaultValue="success@testupi" readOnly />
                        <p className="mt-2 text-xs text-muted">Scan the QR or use the test UPI ID. In test mode no app will open.</p>
                      </div>
                    </div>
                  )}
                  {method === 'CARD' && (
                    <div className="space-y-3">
                      <div><label className="label">Card number</label><input className="input font-mono" defaultValue="4111 1111 1111 1111" readOnly /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="label">Expiry</label><input className="input font-mono" defaultValue="12/30" readOnly /></div>
                        <div><label className="label">CVV</label><input className="input font-mono" defaultValue="123" readOnly /></div>
                      </div>
                      <p className="text-xs text-muted">Test card details are pre-filled and are never sent anywhere.</p>
                    </div>
                  )}
                  {method === 'NETBANKING' && (
                    <div>
                      <label className="label">Bank</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Test Bank of India', 'Sandbox National Bank', 'Demo Co-op Bank', 'Mock Gramin Bank'].map((b) => (
                          <button key={b} type="button" onClick={() => setBank(b)} className={cx('rounded-xl border px-3 py-2.5 text-left text-xs font-semibold', bank === b ? 'border-saffron-500 bg-saffron-50' : 'border-line')}>{b}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {err && <p className="mb-3 text-sm text-rose">{err}</p>}
                {!enabled && <p className="mb-3 text-sm text-rose">The test gateway is disabled outside local mode.</p>}
                <button type="button" onClick={() => complete('success')} disabled={!!busy || !enabled} className="btn-primary btn-lg w-full" data-testid="pay-success">
                  {busy === 'success' ? <><Loader2 className="h-5 w-5 animate-spin" /> Processing…</> : <>Pay {rupees(order.amount, { decimals: order.amount % 100 !== 0 })}</>}
                </button>
                <button type="button" onClick={() => complete('failure')} disabled={!!busy || !enabled} className="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-rose hover:bg-rose/5">
                  {busy === 'failure' ? 'Processing…' : 'Simulate a failed payment'}
                </button>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
