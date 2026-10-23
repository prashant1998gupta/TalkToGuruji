import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { EmptyState, PageHero } from '@/components/ui/primitives';
import { TYPES, hrefFor } from '@/components/content/data';
import { json } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: TYPES.story.label, description: TYPES.story.intro };

export default async function StoriesPage() {
  const stories = await db.content.findMany({ where: { type: 'story', published: true }, orderBy: { createdAt: 'desc' } });
  return (
    <>
      <PageHero eyebrow={TYPES.story.eyebrow} title="Web stories" intro={TYPES.story.intro} crumbs={[{ label: 'Web Stories' }]} />
      <section className="container-x py-12">
        {stories.length === 0 ? <EmptyState title="No stories yet" /> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {stories.map((s, i) => {
              const n = json<{ photos?: unknown[] }>(s.extra, {}).photos?.length ?? 0;
              return (
                <Link key={s.id} href={hrefFor('story', s.slug)} className="group relative aspect-[9/15] overflow-hidden rounded-3xl bg-night-900 shadow-soft ring-2 ring-saffron-400/70 ring-offset-2 ring-offset-cream-100 transition hover:-translate-y-1 hover:shadow-lift">
                  {s.image && <Image src={s.image} alt={s.title} fill priority={i < 5} sizes="(max-width:640px) 50vw, 20vw" className="object-cover transition duration-700 group-hover:scale-105" />}
                  <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">{n} slides</span>
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-12 font-display text-base font-semibold leading-tight text-white">{s.title}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
