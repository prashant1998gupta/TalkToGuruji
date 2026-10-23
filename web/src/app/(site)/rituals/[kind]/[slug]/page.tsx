import { notFound } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { db } from '@/lib/db';
import { Article } from '@/components/content/Article';
import { TYPES, findContent } from '@/components/content/data';
import { contentMetadata } from '@/components/content/pages';
import { json } from '@/lib/format';

const KIND_TYPE: Record<string, 'vrat' | 'festival' | 'aarti' | 'bhajan'> = { vrats: 'vrat', vrat: 'vrat', festivals: 'festival', aarti: 'aarti', bhajan: 'bhajan' };
type P = { params: Promise<{ kind: string; slug: string }> };

export async function generateMetadata({ params }: P) {
  const { kind, slug } = await params;
  const type = KIND_TYPE[kind.toLowerCase()];
  return type ? contentMetadata(type, slug) : {};
}

export default async function RitualDetail({ params }: P) {
  const { kind, slug } = await params;
  const type = KIND_TYPE[kind.toLowerCase()];
  if (!type) notFound();
  const item = await findContent(type, slug);
  if (!item) notFound();
  const meta = TYPES[type];
  // dated rituals: show what comes next in the calendar; others: latest of the same kind
  const related = await db.content.findMany({
    where: { type, published: true, id: { not: item.id }, ...(item.eventDate ? { eventDate: { gte: item.eventDate } } : {}) },
    orderBy: item.eventDate ? { eventDate: 'asc' } : { createdAt: 'desc' },
    take: 3,
  });
  const x = json<{ tithi?: string | null; paksha?: string | null }>(item.extra, {});
  const badge = item.eventDate ? (
    <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-gold-300">
      <CalendarDays className="h-3.5 w-3.5" />
      {item.eventDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      {x.tithi ? ` · ${x.tithi}` : ''}
    </span>
  ) : null;
  return (
    <Article
      item={item}
      crumbs={[{ label: 'Rituals', href: '/rituals' }, { label: meta.label, href: meta.base }, { label: item.subtitle || item.title }]}
      related={related}
      relatedTitle={item.eventDate ? 'Coming up next' : `More ${meta.label.toLowerCase()}`}
      badge={badge}
      hideDate
    />
  );
}
