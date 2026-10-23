import type { Metadata } from 'next';
import { ContentIndex } from '@/components/content/pages';
import { TYPES } from '@/components/content/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: TYPES.blog.label, description: TYPES.blog.intro };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ContentIndex searchParams={searchParams} opts={{ type: 'blog', categories: true, search: true, featured: true, showDates: true }} />;
}
