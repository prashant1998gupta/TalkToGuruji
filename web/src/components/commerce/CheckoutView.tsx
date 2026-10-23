'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gem, Loader2, Lock } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { EmptyState } from '@/components/ui/primitives';
import { inr } from '@/lib/format';
import { OrderSummary, useCart } from './CartView';
import { PayChoice } from './PayChoice';

const STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Chandigarh', 'Andaman & Nicobar', 'Dadra & Nagar Haveli and Daman & Diu', 'Lakshadweep'];
const KEY = 'ttg_ship_addr';

export function CheckoutView() {
  const { user, loading, refresh, toast } = useApp();
  const router = useRouter();
  const [cart] = useCart();
  const [a, setA] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: 'Uttar Pradesh', pincode: '' });
  const [pay, setPay] = useState<'wallet' | 'online'>('online');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let saved: Partial<typeof a> = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch {}
    setA((x) => ({ ...x, name: user?.name || x.name, phone: user?.phone || x.phone, ...saved }));
  }, [user]);

  useEffect(() => {
    if (user && cart) setPay(user.walletBalance >= cart.total * 100 ? 'wallet' : 'online');
  }, [user, cart]);

  if (loading || (user && !cart)) return <div className="h-80 animate-pulse rounded-3xl bg-cream-200" />;
  if (!user) return <EmptyState title="Log in to check out" action={<Link href="/login?next=/checkout" className="btn-primary">Login</Link>} />;
  if (!cart || !cart.lines.length) return <EmptyState title="Your cart is empty" action={<Link href="/astro-mart" className="btn-primary">Shop Astro Mart</Link>} />;

  const set = (k: keyof typeof a) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setA({ ...a, [k]: e.target.value });

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try { localStorage.setItem(KEY, JSON.stringify(a)); } catch {}
    const r = await fetch('/api/orders', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: a, pay }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error); setBusy(false); return; }
    if (j.payUrl) { router.push(j.payUrl); return; }
    await refresh();
    toast('Order placed! 🙏', 'success');
    router.push(j.next);
  };

  return (
    <form onSubmit={place} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="card p-6">
          <p className="font-display text-xl font-semibold">Delivery address</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="a-name">Full name</label><input id="a-name" required minLength={2} className="input" value={a.name} onChange={set('name')} /></div>
            <div><label className="label" htmlFor="a-phone">Mobile</label><input id="a-phone" required inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} className="input" value={a.phone} onChange={set('phone')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="a-l1">House no., building, street</label><input id="a-l1" required minLength={5} className="input" value={a.line1} onChange={set('line1')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="a-l2">Area, landmark <span className="normal-case tracking-normal text-muted/70">(optional)</span></label><input id="a-l2" className="input" value={a.line2} onChange={set('line2')} /></div>
            <div><label className="label" htmlFor="a-city">City</label><input id="a-city" required className="input" value={a.city} onChange={set('city')} /></div>
            <div><label className="label" htmlFor="a-pin">Pincode</label><input id="a-pin" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className="input" value={a.pincode} onChange={set('pincode')} /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="a-state">State</label><select id="a-state" className="input" value={a.state} onChange={set('state')}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
        </div>
        <div className="card p-6">
          <p className="font-display text-xl font-semibold">Items</p>
          <ul className="mt-4 divide-y divide-line">
            {cart.lines.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream-200">{l.image ? <Image src={l.image} alt="" fill sizes="56px" className="object-cover" /> : <Gem className="m-auto mt-4 h-6 w-6 text-saffron-300" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{l.name}</span><span className="text-xs text-muted">{l.variant ? `${l.variant} · ` : ''}Qty {l.qty}</span></span>
                <span className="text-sm font-semibold">{inr(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <OrderSummary cart={cart}>
        <p className="label">Payment</p>
        <PayChoice value={pay} onChange={setPay} balance={user.walletBalance} amount={cart.total * 100} />
        {err && <p className="mt-3 text-sm text-rose">{err}</p>}
        <button className="btn-primary btn-lg mt-5 w-full" disabled={busy}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Lock className="h-4 w-4" /> Place order · {inr(cart.total)}</>}</button>
      </OrderSummary>
    </form>
  );
}
