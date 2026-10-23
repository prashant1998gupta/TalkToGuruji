import { ContentDetail, contentMetadata } from '@/components/content/pages';

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: P) {
  return contentMetadata('remedy', (await params).slug);
}

export default async function Page({ params }: P) {
  return <ContentDetail type="remedy" slug={(await params).slug} />;
}
