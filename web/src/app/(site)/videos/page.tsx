import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PlayCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { EmptyState, PageHero } from '@/components/ui/primitives';
import { TYPES, hrefFor } from '@/components/content/data';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: TYPES.video.label, description: TYPES.video.intro };

export default async function VideosPage() {
  const videos = await db.content.findMany({ where: { type: 'video', published: true }, orderBy: { createdAt: 'desc' } });
  return (
    <>
      <PageHero eyebrow={TYPES.video.eyebrow} title="All videos" intro={TYPES.video.intro} crumbs={[{ label: 'Videos' }]} />
      <section className="container-x py-12">
        {videos.length === 0 ? <EmptyState title="No videos yet" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v, i) => (
              <Link key={v.id} href={hrefFor('video', v.slug)} className="group">
                <div className="relative aspect-video overflow-hidden rounded-3xl bg-night-900 shadow-soft">
                  {v.image && <Image src={v.image} alt={v.title} fill priority={i < 3} sizes="(max-width:640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-80" />}
                  <span className="absolute inset-0 grid place-items-center"><PlayCircle className="h-14 w-14 text-white drop-shadow-lg transition group-hover:scale-110" /></span>
                  {v.category && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase text-night-900">{v.category}</span>}
                </div>
                <h2 className="mt-3 line-clamp-2 font-semibold leading-snug text-night-900 group-hover:text-saffron-700">{v.title}</h2>
                <p className="mt-1 text-xs text-muted">{fmtDate(v.createdAt)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
