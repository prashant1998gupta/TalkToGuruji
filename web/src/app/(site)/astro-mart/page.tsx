import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { BadgeCheck, Gem, ShoppingBag, Sparkles, Truck } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHero, SectionHeading } from '@/components/ui/primitives';
import { ProductCard } from '@/components/commerce/ProductCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Astro Mart — Energized Gemstones, Rudraksha & Yantras',
  description: 'Certified gemstones, rudrakshas, yantras and spiritual products — selected and energized according to your astrological needs.',
};

export default async function AstroMart() {
  const [cats, products] = await Promise.all([
    db.productCategory.findMany({ include: { _count: { select: { products: { where: { active: true } } } } }, orderBy: { name: 'asc' } }),
    db.product.findMany({ where: { active: true }, orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }] }),
  ]);
  return (
    <>
      <PageHero
        eyebrow="Astro Mart"
        title="Energized products for every graha"
        intro="Astro Mart offers a wide range of authentic and energized products — certified gemstones, sacred Rudraksha, yantras and Vastu remedies. Each product is spiritually charged by trained pundits before delivery."
        crumbs={[{ label: 'Astro Mart' }]}
      >
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
          <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-gold-300" /> Lab-certified gemstones</span>
          <span className="flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-gold-300" /> Energized by pundits</span>
          <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-gold-300" /> Free delivery above ₹999</span>
        </div>
      </PageHero>

      <section className="container-x py-12">
        <SectionHeading eyebrow="Shop by category" title="Categories" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {cats.map((c) => (
            <Link key={c.id} href={`/astro-mart/${c.slug}`} className="card-hover group flex flex-col items-center p-5 text-center">
              <span className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-saffron-50 to-gold-300/30 ring-1 ring-saffron-100">
                {c.image ? <Image src={c.image} alt="" fill sizes="80px" className="object-cover transition group-hover:scale-110" /> : <Gem className="h-8 w-8 text-saffron-500" />}
              </span>
              <span className="mt-3 font-semibold text-night-900">{c.name}</span>
              <span className="text-xs text-muted">{c._count.products} product{c._count.products === 1 ? '' : 's'}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pb-6">
        <SectionHeading eyebrow="Handpicked" title="All products" action={{ label: 'View cart', href: '/cart' }} />
        <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}
        </div>
        <div className="night mt-12 flex flex-col items-start gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-display text-2xl font-semibold text-white">Not sure which gemstone suits you?</p>
            <p className="mt-1 text-sm text-white/60">An incorrect gemstone can do more harm than good. Ask an astrologer to check your kundli first.</p>
          </div>
          <Link href="/astrology-services/chat-with-astrologer" className="btn-gold shrink-0"><ShoppingBag className="h-4 w-4" /> Get a recommendation</Link>
        </div>
      </section>
    </>
  );
}
