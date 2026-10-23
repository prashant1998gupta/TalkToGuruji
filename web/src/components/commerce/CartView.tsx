'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Gem, Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { EmptyState } from '@/components/ui/primitives';
import { inr } from '@/lib/format';
import type { CartLine } from './cart';

export type CartData = { lines: CartLine[]; subtotal: number; mrpTotal: number; shipping: number; total: number; count: number };

export function useCart() {
  const [cart, setCart] = useState<CartData | null>(null);
  useEffect(() => { fetch('/api/cart', { cache: 'no-store' }).then((r) => r.json()).then(setCart); }, []);
  return [cart, setCart] as const;
}

export function OrderSummary({ cart, children }: { cart: CartData; children?: React.ReactNode }) {
  const saved = cart.mrpTotal - cart.subtotal;
  return (
    <div className="card sticky top-24 p-6">
      <p className="font-display text-xl font-semibold">Order summary</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Items ({cart.count})</dt><dd>{inr(cart.mrpTotal)}</dd></div>
        {saved > 0 && <div className="flex justify-between text-leaf"><dt>Discount</dt><dd>−{inr(saved)}</dd></div>}
        <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{cart.shipping ? inr(cart.shipping) : <span className="font-semibold text-leaf">FREE</span>}</dd></div>
        <div className="flex justify-between border-t border-line pt-3 text-base font-bold"><dt>Total</dt><dd>{inr(cart.total)}</dd></div>
      </dl>
      {cart.shipping > 0 && <p className="mt-3 rounded-xl bg-saffron-50 px-3 py-2 text-xs text-saffron-700">Add {inr(999 - cart.subtotal)} more for free delivery.</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function CartView() {
  const { user, loading } = useApp();
  const [cart, setCart] = useCart();
  const [busy, setBusy] = useState<string | null>(null);

  const update = async (id: string, qty: number) => {
    setBusy(id);
    const r = await fetch('/api/cart', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, qty }) });
    if (r.ok) setCart(await r.json());
    setBusy(null);
  };

  if (loading || (user && !cart)) return <div className="h-64 animate-pulse rounded-3xl bg-cream-200" />;
  if (!user) return <EmptyState title="Log in to see your cart" action={<Link href="/login?next=/cart" className="btn-primary">Login</Link>} />;
  if (!cart || !cart.lines.length) return <EmptyState title="Your cart is empty" text="Explore energized gemstones, rudraksha and yantras." action={<Link href="/astro-mart" className="btn-primary"><ShoppingBag className="h-4 w-4" /> Shop Astro Mart</Link>} />;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <ul className="space-y-3">
        {cart.lines.map((l) => (
          <li key={l.id} className="card flex gap-4 p-4">
            <Link href={`/astro-mart/product/${l.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-200">
              {l.image ? <Image src={l.image} alt="" fill sizes="96px" className="object-cover" /> : <Gem className="m-auto mt-8 h-8 w-8 text-saffron-300" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/astro-mart/product/${l.slug}`} className="font-semibold leading-snug hover:text-saffron-700">{l.name}</Link>
              {l.variant && <p className="text-xs text-muted">{l.variant}</p>}
              <p className="mt-1 text-sm"><b>{inr(l.price)}</b>{l.mrp > l.price && <span className="ml-1.5 text-xs text-muted line-through">{inr(l.mrp)}</span>}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-full border border-line">
                  <button type="button" className="grid h-8 w-8 place-items-center disabled:opacity-40" disabled={!!busy} onClick={() => update(l.id, l.qty - 1)} aria-label="Decrease"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">{busy === l.id ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : l.qty}</span>
                  <button type="button" className="grid h-8 w-8 place-items-center disabled:opacity-40" disabled={!!busy || l.qty >= Math.min(10, l.stock)} onClick={() => update(l.id, l.qty + 1)} aria-label="Increase"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <button type="button" onClick={() => update(l.id, 0)} className="flex items-center gap-1 text-xs font-semibold text-muted hover:text-rose" disabled={!!busy}><Trash2 className="h-3.5 w-3.5" /> Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <OrderSummary cart={cart}>
        <Link href="/checkout" className="btn-primary btn-lg w-full">Proceed to checkout</Link>
        <Link href="/astro-mart" className="mt-3 block text-center text-sm font-semibold text-saffron-600 hover:underline">Continue shopping</Link>
      </OrderSummary>
    </div>
  );
}
