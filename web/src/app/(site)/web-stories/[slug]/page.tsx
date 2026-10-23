import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { findContent, hrefFor } from '@/components/content/data';
import { contentMetadata } from '@/components/content/pages';
import { StoryViewer } from '@/components/content/StoryViewer';
import { json } from '@/lib/format';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  return contentMetadata('story', (await params).slug);
}

export default async function StoryPage({ params }: P) {
  const s = await findContent('story', (await params).slug);
  if (!s) notFound();
  const slides = json<{ photos?: { src: string; title: string; caption: string }[] }>(s.extra, {}).photos ?? [];
  if (!slides.length) notFound();
  const next = await db.content.findFirst({ where: { type: 'story', published: true, createdAt: { lt: s.createdAt } }, orderBy: { createdAt: 'desc' } });
  return <StoryViewer title={s.title} slides={slides} next={next ? { href: hrefFor('story', next.slug), title: next.title } : null} />;
}
