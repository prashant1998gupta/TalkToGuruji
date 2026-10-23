import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, RotateCcw, Sparkles, Truck } from 'lucide-react';
import { db } from '@/lib/db';
import { Breadcrumbs } from '@/components/ui/primitives';
import { ProductCard } from '@/components/commerce/ProductCard';
import { ProductBuyBox, ProductGallery } from '@/components/commerce/ProductBuyBox';
import { productImages, productVariants } from '@/components/commerce/cart';
import { plain } from '@/components/content/data';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await db.product.findUnique({ where: { slug: (await params).slug } });
  return p ? { title: `${p.name} — Astro Mart`, description: plain(p.excerpt).slice(0, 160), openGraph: { images: productImages(p.images).slice(0, 1) } } : {};
}

export default async function ProductPage({ params }: P) {
  const p = await db.product.findUnique({ where: { slug: (await params).slug }, include: { category: true } });
  if (!p || !p.active) notFound();
  const more = await db.product.findMany({ where: { active: true, id: { not: p.id } }, take: 4, orderBy: { featured: 'desc' } });
  return (
    <>
      <section className="container-x py-8">
        <Breadcrumbs items={[{ label: 'Astro Mart', href: '/astro-mart' }, { label: p.category.name, href: `/astro-mart/${p.category.slug}` }, { label: p.name }]} />
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery images={productImages(p.images)} name={p.name} />
          <div>
            <p className="eyebrow">{p.category.name}</p>
            <h1 className="h-display mt-2 text-3xl leading-tight text-night-900 sm:text-4xl">{p.name}</h1>
            {p.origin && <p className="mt-2 flex items-center gap-1.5 text-sm capitalize text-muted"><MapPin className="h-4 w-4" /> Origin: {p.origin}</p>}
            <p className="mt-4 leading-relaxed text-ink/75">{plain(p.excerpt)}</p>
            <div className="mt-6 border-t border-line pt-6">
              <ProductBuyBox product={{ id: p.id, slug: p.slug, price: p.price, mrp: p.mrp, stock: p.stock, variants: productVariants(p.variants) }} />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
              {[[BadgeCheck, 'Lab certified'], [Sparkles, 'Energized'], [Truck, 'Free shipping ₹999+'], [RotateCcw, 'Damage replacement']].map(([I, t]) => {
                const Ico = I as typeof Truck;
                return <div key={t as string} className="flex flex-col items-center gap-1.5 rounded-2xl bg-white p-3 text-center font-semibold ring-1 ring-line"><Ico className="h-5 w-5 text-saffron-600" />{t as string}</div>;
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="container-x grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card p-6 sm:p-8">
          <h2 className="h-display mb-2 text-2xl text-night-900">About this product</h2>
          <div className="prose-guru" dangerouslySetInnerHTML={{ __html: p.body }} />
        </div>
        {p.summary && (
          <div className="h-fit rounded-3xl border border-gold-400/40 bg-gradient-to-br from-cream-50 to-saffron-50 p-6">
            <div className="prose-guru text-sm [&_h3]:mt-0" dangerouslySetInnerHTML={{ __html: p.summary.replace(/\?\s*<strong>/g, '<strong>') }} />
          </div>
        )}
      </section>

      {more.length > 0 && (
        <section className="container-x pb-6">
          <h2 className="h-display mb-6 text-2xl text-night-900">You may also like</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{more.map((m) => <ProductCard key={m.id} p={m} />)}</div>
        </section>
      )}
    </>
  );
}
