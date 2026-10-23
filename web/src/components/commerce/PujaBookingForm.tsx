'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Lock, MonitorPlay, Home } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { PayChoice } from './PayChoice';
import { cx, inr } from '@/lib/format';

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function PujaBookingForm({ puja }: { puja: { id: string; slug: string; name: string; price: number; mrp: number } }) {
  const { user, loading, refresh, toast } = useApp();
  const router = useRouter();
  const tomorrow = new Date(Date.now() + 86400000);
  const maxDate = new Date(Date.now() + 180 * 86400000);
  const [f, setF] = useState({ date: ymd(new Date(Date.now() + 3 * 86400000)), mode: 'ONLINE' as 'ONLINE' | 'OFFLINE', devoteeName: '', gotra: '', purpose: '', address: '' });
  const [pay, setPay] = useState<'wallet' | 'online'>('online');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (user) {
      setF((x) => ({ ...x, devoteeName: x.devoteeName || user.name || '' }));
      setPay(user.walletBalance >= puja.price * 100 ? 'wallet' : 'online');
    }
  }, [user, puja.price]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    const r = await fetch('/api/puja/book', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, pujaId: puja.id, pay }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error); setBusy(false); return; }
    if (j.payUrl) { router.push(j.payUrl); return; }
    await refresh();
    toast('Puja booked! We’ll share the live link before the puja.', 'success');
    router.push(j.next);
  };

  if (loading) return <div className="h-80 animate-pulse rounded-3xl bg-cream-200" />;

  if (!user) {
    return (
      <div className="text-center">
        <Lock className="mx-auto h-8 w-8 text-saffron-500" />
        <p className="mt-3 font-semibold">Log in to book this puja</p>
        <p className="mt-1 text-sm text-muted">We need your details for the sankalp.</p>
        <Link href={`/login?next=/puja/${puja.slug}`} className="btn-primary mt-5 w-full">Login to book</Link>
      </div>
    );
  }
  if (user.role !== 'USER') return <p className="text-center text-sm text-muted">Bookings can be made from a user account.</p>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label">Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {([['ONLINE', 'Online (live video)', MonitorPlay], ['OFFLINE', 'At my home', Home]] as const).map(([v, l, I]) => (
            <button key={v} type="button" onClick={() => setF({ ...f, mode: v })} className={cx('flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition', f.mode === v ? 'border-night-900 bg-night-900 text-white' : 'border-line bg-white text-ink/75 hover:border-saffron-300')}>
              <I className="h-4 w-4" /> {l}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="pb-date">Puja date</label>
        <input id="pb-date" type="date" required className="input" min={ymd(tomorrow)} max={ymd(maxDate)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="pb-name">Devotee name</label>
          <input id="pb-name" required minLength={2} className="input" value={f.devoteeName} onChange={(e) => setF({ ...f, devoteeName: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="pb-gotra">Gotra</label>
          <input id="pb-gotra" className="input" placeholder="e.g. Kashyap" value={f.gotra} onChange={(e) => setF({ ...f, gotra: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="pb-purpose">Purpose / sankalp</label>
        <input id="pb-purpose" className="input" placeholder="e.g. Peace and prosperity for family" value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} />
      </div>
      {f.mode === 'OFFLINE' && (
        <div>
          <label className="label" htmlFor="pb-addr">Full address</label>
          <textarea id="pb-addr" required minLength={10} rows={3} className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        </div>
      )}
      <PayChoice value={pay} onChange={setPay} balance={user.walletBalance} amount={puja.price * 100} />
      {err && <p className="text-sm text-rose">{err}</p>}
      <button className="btn-primary btn-lg w-full" disabled={busy}>
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{pay === 'wallet' ? 'Pay from wallet' : 'Proceed to pay'} · {inr(puja.price)}</>}
      </button>
      <p className="text-center text-xs text-muted">Free rescheduling up to 24 hours before the puja.</p>
    </form>
  );
}
