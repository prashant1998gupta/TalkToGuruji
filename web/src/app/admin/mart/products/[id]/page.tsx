import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { ENTITIES, toFormValues } from '@/components/admin/entities';
import { EntityForm } from '@/components/admin/EntityForm';
import { PageHeader } from '@/components/admin/ui';

export default async function ProductEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';
  const [row, cats] = await Promise.all([isNew ? null : db.product.findUnique({ where: { id } }), db.productCategory.findMany({ orderBy: { name: 'asc' } })]);
  if (!isNew && !row) notFound();
  const initial = { ...toFormValues(ENTITIES.product.fields, row), ...(isNew ? { active: true, featured: false, stock: 50, categoryId: cats[0]?.id || '' } : {}) };
  return (
    <div className="max-w-5xl">
      <Link href="/admin/mart" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Astro Mart</Link>
      <PageHeader title={row?.name || 'New product'} sub="Prices in whole rupees. If you add variants, their prices are used at checkout." />
      {!cats.length ? (
        <p className="card p-5 text-sm">Create a category first in <Link href="/admin/mart?tab=categories" className="text-saffron-700 underline">Categories</Link>.</p>
      ) : (
        <div className="card p-5">
          <EntityForm
            entity="product"
            id={row?.id}
            initial={initial}
            options={{ categoryId: cats.map((c) => ({ value: c.id, label: c.name })) }}
            afterSave={isNew ? '/admin/mart/products/{id}' : undefined}
            deleteRedirect="/admin/mart"
          />
        </div>
      )}
    </div>
  );
}
