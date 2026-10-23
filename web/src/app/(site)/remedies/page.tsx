import type { Metadata } from 'next';
import { ContentIndex } from '@/components/content/pages';
import { TYPES } from '@/components/content/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: TYPES.remedy.label, description: TYPES.remedy.intro };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ContentIndex searchParams={searchParams} opts={{ type: 'remedy', order: 'old', perPage: 24 }} />;
}
