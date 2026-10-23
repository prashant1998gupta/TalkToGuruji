import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Images } from 'lucide-react';
import { db } from '@/lib/db';
import { EmptyState, PageHero } from '@/components/ui/primitives';
import { TYPES, hrefFor } from '@/components/content/data';
import { json } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: TYPES.gallery.label, description: TYPES.gallery.intro };

export default async function GalleryIndex() {
  const albums = await db.content.findMany({ where: { type: 'gallery', published: true }, orderBy: { createdAt: 'desc' } });
  return (
    <>
      <PageHero eyebrow={TYPES.gallery.eyebrow} title="Photo gallery" intro={TYPES.gallery.intro} crumbs={[{ label: 'Photo Gallery' }]} />
      <section className="container-x py-12">
        {albums.length === 0 ? <EmptyState title="No albums yet" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((a, i) => {
              const photos = json<{ photos?: { src: string }[] }>(a.extra, {}).photos ?? [];
              return (
                <Link key={a.id} href={hrefFor('gallery', a.slug)} className="card-hover group overflow-hidden">
                  <div className="grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-1 bg-cream-200">
                    {photos.slice(0, 3).map((p, k) => (
                      <div key={k} className={`relative overflow-hidden ${k === 0 ? 'col-span-2 row-span-2' : ''}`}>
                        <Image src={p.src} alt="" fill priority={i < 3 && k === 0} sizes={k === 0 ? '(max-width:640px) 66vw, 22vw' : '12vw'} className="object-cover transition duration-700 group-hover:scale-105" />
                      </div>
                    ))}
                  </div>
                  <div className="p-5">
                    <h2 className="font-display text-xl font-semibold leading-snug text-night-900 group-hover:text-saffron-700">{a.title}</h2>
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-muted"><Images className="h-3.5 w-3.5" /> {photos.length} photos · {a.author}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
