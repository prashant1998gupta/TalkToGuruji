import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { EmptyState, PageHero } from '@/components/ui/primitives';
import { ContentCard } from '@/components/ui/ContentCard';
import { TYPES, hrefFor } from '@/components/content/data';
import { json } from '@/lib/format';

export const dynamic = 'force-dynamic';

const KIND_TYPE: Record<string, 'vrat' | 'festival' | 'aarti' | 'bhajan'> = { vrats: 'vrat', vrat: 'vrat', festivals: 'festival', aarti: 'aarti', bhajan: 'bhajan' };
type P = { params: Promise<{ kind: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const type = KIND_TYPE[(await params).kind.toLowerCase()];
  return type ? { title: TYPES[type].label, description: TYPES[type].intro } : {};
}

export default async function RitualList({ params }: P) {
  const type = KIND_TYPE[(await params).kind.toLowerCase()];
  if (!type) notFound();
  const meta = TYPES[type];
  const dated = type === 'festival' || type === 'vrat';
  const items = await db.content.findMany({ where: { type, published: true }, orderBy: dated ? { eventDate: 'asc' } : { createdAt: 'asc' } });
  const crumbs = [{ label: 'Rituals', href: '/rituals' }, { label: meta.label }];

  if (!dated) {
    return (
      <>
        <PageHero eyebrow={meta.eyebrow} title={meta.label} intro={meta.intro} crumbs={crumbs} />
        <section className="container-x py-12">
          {items.length === 0 ? <EmptyState title="Coming soon" /> : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((c) => <ContentCard key={c.id} href={hrefFor(type, c.slug)} title={c.title} image={c.image} excerpt={c.excerpt} aspect="square" />)}
            </div>
          )}
        </section>
      </>
    );
  }

  // Group the calendar by month
  const groups = new Map<string, typeof items>();
  for (const c of items) {
    const key = c.eventDate ? c.eventDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Other';
    groups.set(key, [...(groups.get(key) || []), c]);
  }
  const years = [...new Set(items.map((c) => c.eventDate?.getFullYear()).filter(Boolean))];

  return (
    <>
      <PageHero eyebrow={meta.eyebrow} title={type === 'vrat' ? `Sacred Vrats of ${years.join(', ')}` : `Festivals of ${years.join(', ')}`} intro={meta.intro} crumbs={crumbs}>
        <nav className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Jump to month">
          {[...groups.keys()].map((m) => (
            <a key={m} href={`#${m.replace(/\s+/g, '-')}`} className="shrink-0 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-semibold text-white/75 transition hover:border-gold-400 hover:text-gold-300">{m.split(' ')[0].slice(0, 3)}</a>
          ))}
        </nav>
      </PageHero>
      <section className="container-x space-y-12 py-12">
        {[...groups.entries()].map(([month, list]) => (
          <div key={month} id={month.replace(/\s+/g, '-')} className="scroll-mt-28">
            <h2 className="h-display mb-5 flex items-center gap-3 text-2xl text-night-900">
              {month}<span className="h-px flex-1 bg-gradient-to-r from-gold-400/60 to-transparent" /><span className="text-sm font-sans font-semibold text-muted">{list.length}</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const x = json<{ tithi?: string | null; paksha?: string | null }>(c.extra, {});
                return (
                  <Link key={c.id} href={hrefFor(type, c.slug)} className="card-hover group flex gap-4 p-3">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-night-900">
                      {c.image && <Image src={c.image} alt="" fill sizes="96px" className="object-cover opacity-80" />}
                      {c.eventDate && (
                        <span className="absolute inset-0 flex flex-col items-center justify-center bg-night-950/45 text-white">
                          <span className="font-display text-3xl font-semibold leading-none">{c.eventDate.getDate()}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gold-300">{c.eventDate.toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 py-0.5">
                      <h3 className="line-clamp-2 font-semibold leading-snug text-night-900 group-hover:text-saffron-700">{c.subtitle || c.title}</h3>
                      {(x.tithi || x.paksha) && <p className="mt-1 text-xs font-semibold text-saffron-600">{[x.tithi, x.paksha && `${x.paksha} paksha`].filter(Boolean).join(' · ')}</p>}
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{c.excerpt}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
        {items.length === 0 && <EmptyState title="Calendar coming soon" />}
      </section>
    </>
  );
}
