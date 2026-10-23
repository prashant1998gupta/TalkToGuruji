import Image from 'next/image';
import Link from 'next/link';
import { Gem } from 'lucide-react';
import { inr } from '@/lib/format';
import { productImages, productVariants } from './cart';

type P = { slug: string; name: string; images: string; price: number; mrp: number; variants: string; excerpt: string };

export function ProductCard({ p, priority }: { p: P; priority?: boolean }) {
  const img = productImages(p.images)[0];
  const vs = productVariants(p.variants);
  const from = vs.length ? Math.min(...vs.map((v) => v.price)) : p.price;
  const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  return (
    <Link href={`/astro-mart/product/${p.slug}`} className="card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-cream-100 to-cream-200">
        {img ? (
          <Image src={img} alt={p.name} fill priority={priority} sizes="(max-width:640px) 50vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center"><Gem className="h-14 w-14 text-saffron-300 transition group-hover:rotate-12 group-hover:scale-110" /></div>
        )}
        {off > 0 && <span className="absolute left-3 top-3 rounded-full bg-leaf px-2 py-0.5 text-[10px] font-bold text-white">{off}% OFF</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug text-night-900 group-hover:text-saffron-700">{p.name}</h3>
        <p className="mt-1 line-clamp-2 flex-1 text-xs text-muted">{p.excerpt}</p>
        <p className="mt-3 text-sm">
          {vs.length > 1 && <span className="text-xs text-muted">From </span>}
          <b className="text-night-900">{inr(from)}</b>
          {off > 0 && vs.length <= 1 && <span className="ml-1.5 text-xs text-muted line-through">{inr(p.mrp)}</span>}
        </p>
      </div>
    </Link>
  );
}
