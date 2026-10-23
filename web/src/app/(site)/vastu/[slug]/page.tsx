import { ContentDetail, contentMetadata } from '@/components/content/pages';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  return contentMetadata('vastu', (await params).slug);
}

export default async function Page({ params }: P) {
  return <ContentDetail type="vastu" slug={(await params).slug} />;
}
