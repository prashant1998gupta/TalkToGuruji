import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { EmptyState, PageHero } from '@/components/ui/primitives';
import { ProductCard } from '@/components/commerce/ProductCard';
import { cx } from '@/lib/format';

type P = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await db.productCategory.findUnique({ where: { slug: (await params).category } });
  return c ? { title: `${c.name} — Astro Mart`, description: c.description.slice(0, 160) } : {};
}

export default async function CategoryPage({ params }: P) {
  const slug = (await params).category;
  const [cat, cats] = await Promise.all([db.productCategory.findUnique({ where: { slug } }), db.productCategory.findMany({ orderBy: { name: 'asc' } })]);
  if (!cat) notFound();
  const products = await db.product.findMany({ where: { categoryId: cat.id, active: true }, orderBy: [{ featured: 'desc' }, { price: 'asc' }] });
  const intro = cat.description.replace(/\\u003C[^]*?\\u003E|<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return (
    <>
      <PageHero eyebrow="Astro Mart" title={cat.name} intro={intro || undefined} crumbs={[{ label: 'Astro Mart', href: '/astro-mart' }, { label: cat.name }]} />
      <section className="container-x py-10">
        <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
          {cats.map((c) => (
            <Link key={c.id} href={`/astro-mart/${c.slug}`} className={cx('shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition', c.id === cat.id ? 'bg-night-900 text-white ring-night-900' : 'bg-white text-ink/75 ring-line hover:ring-saffron-300')}>{c.name}</Link>
          ))}
        </div>
        {products.length === 0 ? (
          <EmptyState title="New arrivals coming soon" text="We’re energizing fresh stock for this category." action={<Link href="/astro-mart" className="btn-ghost">Browse all products</Link>} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">{products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 4} />)}</div>
        )}
      </section>
    </>
  );
}
