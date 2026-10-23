import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/primitives';
import { findContent } from '@/components/content/data';
import { contentMetadata } from '@/components/content/pages';
import { GalleryGrid } from '@/components/content/GalleryGrid';
import { ShareButtons } from '@/components/content/ShareButtons';
import { json } from '@/lib/format';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  return contentMetadata('gallery', (await params).slug);
}

export default async function AlbumPage({ params }: P) {
  const a = await findContent('gallery', (await params).slug);
  if (!a) notFound();
  const photos = json<{ photos?: { src: string; title: string; caption: string }[] }>(a.extra, {}).photos ?? [];
  return (
    <>
      <PageHero
        eyebrow={`${photos.length} photos`}
        title={a.title}
        intro={a.body ? <div className="[&_p]:my-1" dangerouslySetInnerHTML={{ __html: a.body }} /> : null}
        crumbs={[{ label: 'Photo Gallery', href: '/photo-gallery' }, { label: a.title }]}
      >
        <ShareButtons title={a.title} dark />
      </PageHero>
      <section className="container-x py-12">
        <GalleryGrid photos={photos} />
      </section>
    </>
  );
}
