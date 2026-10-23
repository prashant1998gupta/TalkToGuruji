import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { fmtDateTime } from '@/lib/format';
import { CONTENT_EXTRA_HINT, CONTENT_TYPES, ENTITIES, toFormValues } from '@/components/admin/entities';
import { EntityForm } from '@/components/admin/EntityForm';
import { PageHeader } from '@/components/admin/ui';

/** /admin/content/new?type=blog creates; /admin/content/<id> edits. */
export default async function ContentEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ type?: string }> }) {
  const { id } = await params;
  const isNew = id === 'new';
  const row = isNew ? null : await db.content.findUnique({ where: { id } });
  if (!isNew && !row) notFound();
  const type = row?.type || ((CONTENT_TYPES as readonly string[]).includes((await searchParams).type || '') ? (await searchParams).type! : 'blog');
  const fields = ENTITIES.content.fields;
  const initial = { ...toFormValues(fields, row), ...(isNew ? { type, author: 'Guru Ji', published: true } : {}) };
  // event date only matters for festivals / vrats
  const hide = type === 'festival' || type === 'vrat' ? [] : ['eventDate'];

  return (
    <div className="max-w-5xl">
      <Link href={`/admin/content?type=${type}`} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> {type[0].toUpperCase() + type.slice(1)} list</Link>
      <PageHeader title={isNew ? `New ${type}` : row!.title} sub={row ? `Last updated ${fmtDateTime(row.updatedAt)}` : 'Fill in the details and save. Toggle “Published” off to keep it as a draft.'} />
      {CONTENT_EXTRA_HINT[type] && (
        <p className="mb-4 rounded-xl bg-cream-200/70 px-3 py-2 text-xs text-ink/70">
          Extra data format for <b>{type}</b>: <code className="font-mono">{CONTENT_EXTRA_HINT[type]}</code>
        </p>
      )}
      <div className="card p-5">
        <EntityForm entity="content" id={row?.id} initial={initial} hide={hide} afterSave={isNew ? '/admin/content/{id}' : undefined} deleteRedirect={`/admin/content?type=${type}`} />
      </div>
    </div>
  );
}
