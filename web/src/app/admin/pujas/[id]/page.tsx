import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { ENTITIES, toFormValues } from '@/components/admin/entities';
import { EntityForm } from '@/components/admin/EntityForm';
import { PageHeader } from '@/components/admin/ui';

export default async function PujaEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';
  const row = isNew ? null : await db.puja.findUnique({ where: { id } });
  if (!isNew && !row) notFound();
  const initial = { ...toFormValues(ENTITIES.puja.fields, row), ...(isNew ? { tier: 'standard', active: true } : {}) };
  return (
    <div className="max-w-5xl">
      <Link href="/admin/pujas" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Pujas</Link>
      <PageHeader title={row?.name || 'New puja'} sub="Prices are in whole rupees. The discount badge is calculated from MRP vs price." />
      <div className="card p-5">
        <EntityForm entity="puja" id={row?.id} initial={initial} afterSave={isNew ? '/admin/pujas/{id}' : undefined} deleteRedirect="/admin/pujas" />
      </div>
    </div>
  );
}
