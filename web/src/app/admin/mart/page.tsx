import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { inr, json } from '@/lib/format';
import { ActionButton } from '@/components/admin/client';
import { CrudTable } from '@/components/admin/CrudTable';
import { FilterBar, PageHeader, Table, Tabs } from '@/components/admin/ui';

export const metadata = { title: 'Astro Mart' };

export default async function MartPage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string; cat?: string }> }) {
  const sp = await searchParams;
  const tab = sp.tab === 'categories' ? 'categories' : 'products';
  const [products, cats] = await Promise.all([
    tab === 'products'
      ? db.product.findMany({ where: { ...(sp.q ? { name: { contains: sp.q } } : {}), ...(sp.cat ? { categoryId: sp.cat } : {}) }, orderBy: { createdAt: 'desc' }, include: { category: { select: { name: true } } } })
      : [],
    db.productCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }),
  ]);

  return (
    <>
      <PageHeader title="Astro Mart" sub="Gemstones, rudraksha, yantras and other products." actions={tab === 'products' ? <Link href="/admin/mart/products/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New product</Link> : undefined} />
      <Tabs active={tab} tabs={[{ key: 'products', label: 'Products', href: '/admin/mart' }, { key: 'categories', label: 'Categories', href: '/admin/mart?tab=categories', count: cats.length }]} />
      {tab === 'categories' ? (
        <CrudTable entity="productCategory" rows={cats.map(({ _count, ...c }) => ({ ...c, products: _count.products }))} />
      ) : (
        <>
          <FilterBar q={sp.q} placeholder="Search products">
            <select name="cat" defaultValue={sp.cat || ''} className="input !w-auto" aria-label="Category">
              <option value="">All categories</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FilterBar>
          <Table head={['', 'Product', 'Category', 'Price', 'Variants', 'Stock', 'Status', '']} empty={!products.length}>
            {products.map((p) => {
              const img = json<string[]>(p.images, [])[0];
              const variants = json<unknown[]>(p.variants, []).length;
              return (
                <tr key={p.id}>
                  <td className="w-14">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {img ? <img src={img} alt="" className="h-10 w-10 rounded-lg object-cover" loading="lazy" /> : <span className="block h-10 w-10 rounded-lg bg-cream-200" />}
                  </td>
                  <td><Link href={`/admin/mart/products/${p.id}`} className="font-semibold text-night-900 hover:text-saffron-700">{p.name}</Link>{p.featured && <span className="ml-1.5 text-xs text-gold-500">★</span>}</td>
                  <td className="text-muted">{p.category.name}</td>
                  <td className="tabular-nums font-semibold">{inr(p.price)} <span className="text-xs font-normal text-muted line-through">{p.mrp > p.price ? inr(p.mrp) : ''}</span></td>
                  <td className="tabular-nums">{variants || '—'}</td>
                  <td className={`tabular-nums ${p.stock <= 5 ? 'font-semibold text-rose' : ''}`}>{p.stock}</td>
                  <td>
                    <ActionButton url={`/api/admin/crud/product/${p.id}`} payload={{ active: !p.active }} success={p.active ? 'Product hidden' : 'Product is live'} className={`btn btn-sm !px-2.5 !py-1 text-[11px] ${p.active ? 'bg-leaf/10 text-leaf' : 'bg-cream-200 text-muted'}`}>
                      {p.active ? '● Live' : '○ Hidden'}
                    </ActionButton>
                  </td>
                  <td className="text-right"><Link href={`/admin/mart/products/${p.id}`} className="btn-ghost btn-sm">Edit</Link></td>
                </tr>
              );
            })}
          </Table>
        </>
      )}
    </>
  );
}
