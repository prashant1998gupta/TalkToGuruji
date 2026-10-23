'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { cx, inr } from '@/lib/format';

type Pack = { id: string; amount: number; bonus: number; popular: boolean };

export function RechargePanel({ packs, gst, suggested }: { packs: Pack[]; gst: number; suggested: number }) {
  const initial = (suggested ? packs.find((p) => p.amount >= suggested) : packs.find((p) => p.popular)) || packs[0];
  const [sel, setSel] = useState<string | 'custom'>(suggested && !packs.some((p) => p.amount >= suggested) ? 'custom' : initial?.id);
  const [custom, setCustom] = useState(suggested ? String(suggested) : '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const pack = packs.find((p) => p.id === sel);
  const base = pack ? pack.amount : Number(custom) || 0;
  const bonus = pack ? Math.round((pack.amount * pack.bonus) / 100) : 0;
  const tax = Math.round(base * gst) / 100;
  const total = base + tax;

  const pay = async () => {
    setErr('');
    if (base < 50) return setErr('Minimum recharge is ₹50.');
    setBusy(true);
    const r = await fetch('/api/payments/create', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(pack ? { purpose: 'RECHARGE', packId: pack.id } : { purpose: 'RECHARGE', amount: Math.round(base) }) });
    const j = await r.json();
    if (!r.ok) { setBusy(false); return setErr(j.error); }
    window.location.href = j.payUrl;
  };

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-xl font-semibold">Choose an amount</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {packs.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSel(p.id)}
            aria-pressed={sel === p.id}
            className={cx('relative rounded-2xl border-2 px-3 pb-3 pt-4 text-center transition', sel === p.id ? 'border-saffron-500 bg-saffron-50' : 'border-line bg-white hover:border-saffron-200')}
          >
            {p.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-night-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-300">Popular</span>}
            <span className="block font-display text-2xl font-semibold text-night-900">{inr(p.amount)}</span>
            {p.bonus > 0 ? <span className="mt-1 block text-[11px] font-bold text-leaf">+{p.bonus}% extra</span> : <span className="mt-1 block text-[11px] text-muted">&nbsp;</span>}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <label className="label" htmlFor="custom-amt">Or enter an amount</label>
        <div className={cx('flex overflow-hidden rounded-xl border-2 bg-white transition', sel === 'custom' ? 'border-saffron-500' : 'border-line')}>
          <span className="grid place-items-center bg-cream-100 px-4 font-semibold text-muted">₹</span>
          <input id="custom-amt" inputMode="numeric" value={custom} onFocus={() => setSel('custom')} onChange={(e) => { setSel('custom'); setCustom(e.target.value.replace(/\D/g, '').slice(0, 6)); }} placeholder="Minimum ₹50" className="min-w-0 flex-1 px-3 py-3 outline-none" />
        </div>
      </div>

      <dl className="mt-6 space-y-2 rounded-2xl bg-cream-100 p-4 text-sm">
        <Row k="Recharge amount" v={inr(base)} />
        <Row k={`GST (${gst}%)`} v={`₹${tax.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} />
        <div className="gold-rule my-1" />
        <Row k="Total payable" v={`₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`} strong />
        <Row k="You get in wallet" v={inr(base + bonus)} green />
      </dl>
      {bonus > 0 && <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-leaf"><Sparkles className="h-3.5 w-3.5" /> Includes {inr(bonus)} bonus credit</p>}
      {err && <p className="mt-3 text-sm text-rose">{err}</p>}
      <button type="button" onClick={pay} disabled={busy || base < 50} className="btn-primary btn-lg mt-5 w-full">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : `Proceed to pay ₹${total.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
      </button>
    </div>
  );
}

function Row({ k, v, strong, green }: { k: string; v: string; strong?: boolean; green?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={strong ? 'font-semibold' : 'text-muted'}>{k}</dt>
      <dd className={cx('tabular-nums', strong && 'text-base font-bold', green && 'font-bold text-leaf')}>{v}</dd>
    </div>
  );
}
