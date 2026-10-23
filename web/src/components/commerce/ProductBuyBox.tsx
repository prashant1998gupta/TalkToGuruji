'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gem, Loader2, Minus, Plus, ShoppingBag, Zap } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { cx, inr } from '@/lib/format';
import type { Variant } from './cart';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  if (!images.length) {
    return <div className="grid aspect-square place-items-center rounded-3xl bg-gradient-to-br from-cream-100 to-saffron-100"><Gem className="h-24 w-24 text-saffron-300" /></div>;
  }
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-cream-200">
        <Image key={images[i]} src={images[i]} alt={name} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="animate-fade-up object-cover [animation-duration:.3s]" />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, k) => (
            <button key={src} type="button" onClick={() => setI(k)} className={cx('relative h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition', k === i ? 'ring-saffron-500' : 'ring-transparent opacity-70 hover:opacity-100')} aria-label={`Image ${k + 1}`}>
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductBuyBox({ product }: { product: { id: string; slug: string; price: number; mrp: number; stock: number; variants: Variant[] } }) {
  const { user, toast } = useApp();
  const router = useRouter();
  const [variant, setVariant] = useState(product.variants[0]?.label ?? '');
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState<'cart' | 'buy' | null>(null);
  const v = product.variants.find((x) => x.label === variant);
  const price = v?.price ?? product.price;
  const mrp = v?.mrp ?? product.mrp;
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const out = product.stock <= 0;

  const add = async (mode: 'cart' | 'buy') => {
    if (!user) { router.push(`/login?next=/astro-mart/product/${product.slug}`); return; }
    if (user.role !== 'USER') { toast('Shopping is available from a user account.', 'error'); return; }
    setBusy(mode);
    const r = await fetch('/api/cart', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ productId: product.id, variant, qty }) });
    const j = await r.json();
    setBusy(null);
    if (!r.ok) { toast(j.error, 'error'); return; }
    if (mode === 'buy') router.push('/checkout');
    else toast(`Added to cart · ${j.count} item${j.count === 1 ? '' : 's'}`, 'success');
  };

  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="font-display text-4xl font-semibold text-night-900">{inr(price)}</span>
        {off > 0 && <><span className="pb-1 text-lg text-muted line-through">{inr(mrp)}</span><span className="mb-1.5 rounded-full bg-leaf/10 px-2.5 py-0.5 text-xs font-bold text-leaf">Save {off}%</span></>}
      </div>
      <p className="mt-1 text-xs text-muted">Inclusive of all taxes · Free delivery above ₹999</p>

      {product.variants.length > 0 && (
        <div className="mt-6">
          <p className="label">Choose weight</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((x) => (
              <button key={x.label} type="button" onClick={() => setVariant(x.label)} className={cx('rounded-xl border px-4 py-2.5 text-left text-sm transition', variant === x.label ? 'border-saffron-500 bg-saffron-50 ring-4 ring-saffron-100' : 'border-line bg-white hover:border-saffron-300')}>
                <span className="block font-semibold">{x.label}</span>
                <span className="block text-xs text-muted">{inr(x.price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center gap-4">
        <p className="label !mb-0">Qty</p>
        <div className="flex items-center rounded-full border border-line bg-white">
          <button type="button" className="grid h-10 w-10 place-items-center disabled:opacity-40" onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} aria-label="Decrease"><Minus className="h-4 w-4" /></button>
          <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
          <button type="button" className="grid h-10 w-10 place-items-center disabled:opacity-40" onClick={() => setQty(Math.min(10, product.stock, qty + 1))} disabled={qty >= Math.min(10, product.stock)} aria-label="Increase"><Plus className="h-4 w-4" /></button>
        </div>
        <span className={cx('text-xs font-semibold', out ? 'text-rose' : product.stock < 10 ? 'text-saffron-600' : 'text-leaf')}>{out ? 'Out of stock' : product.stock < 10 ? `Only ${product.stock} left` : 'In stock'}</span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => add('cart')} disabled={out || !!busy} className="btn-ghost btn-lg">{busy === 'cart' ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ShoppingBag className="h-5 w-5" /> Add to cart</>}</button>
        <button type="button" onClick={() => add('buy')} disabled={out || !!busy} className="btn-primary btn-lg">{busy === 'buy' ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="h-5 w-5" /> Buy now</>}</button>
      </div>
    </div>
  );
}
