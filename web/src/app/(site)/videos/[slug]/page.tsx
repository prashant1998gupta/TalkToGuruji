import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { Breadcrumbs } from '@/components/ui/primitives';
import { findContent, hrefFor, youTubeId } from '@/components/content/data';
import { contentMetadata } from '@/components/content/pages';
import { LiteYouTube } from '@/components/content/LiteYouTube';
import { ShareButtons } from '@/components/content/ShareButtons';
import { fmtDate, json } from '@/lib/format';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  return contentMetadata('video', (await params).slug);
}

export default async function VideoPage({ params }: P) {
  const v = await findContent('video', (await params).slug);
  if (!v) notFound();
  const { videoUrl } = json<{ videoUrl?: string }>(v.extra, {});
  const id = youTubeId(videoUrl);
  const more = await db.content.findMany({ where: { type: 'video', published: true, id: { not: v.id } }, orderBy: { createdAt: 'desc' }, take: 6 });
  return (
    <section className="night">
      <div className="container-x grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <Breadcrumbs items={[{ label: 'Videos', href: '/videos' }, { label: v.title }]} dark />
          <div className="mt-5">
            {id ? <LiteYouTube id={id} title={v.title} poster={v.image} /> : v.image && <div className="relative aspect-video overflow-hidden rounded-3xl"><Image src={v.image} alt={v.title} fill className="object-cover" /></div>}
          </div>
          <h1 className="h-display mt-6 text-2xl leading-snug text-white sm:text-3xl">{v.title}</h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
            <p className="text-sm text-white/55">{v.author ? `${v.author} · ` : ''}{fmtDate(v.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <ShareButtons title={v.title} dark />
          </div>
          <div className="prose-guru mt-6 max-w-[72ch] rounded-3xl bg-cream-50 p-6 sm:p-8" dangerouslySetInnerHTML={{ __html: v.body }} />
        </div>
        <aside>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-gold-300">Up next</p>
          <div className="space-y-3">
            {more.map((m) => (
              <Link key={m.id} href={hrefFor('video', m.slug)} className="group flex gap-3 rounded-2xl p-2 transition hover:bg-white/5">
                <div className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-xl bg-night-800">
                  {m.image && <Image src={m.image} alt="" fill sizes="144px" className="object-cover" />}
                  <PlayCircle className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-white/90" />
                </div>
                <p className="line-clamp-3 text-sm font-medium leading-snug text-white/85 group-hover:text-gold-300">{m.title}</p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
