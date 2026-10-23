import type { Metadata } from 'next';
import { ContentIndex } from '@/components/content/pages';
import { TYPES } from '@/components/content/data';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: TYPES.numerology.label, description: TYPES.numerology.intro };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ContentIndex searchParams={searchParams} opts={{ type: 'numerology', order: 'old', perPage: 12, aspect: 'square' }} />;
}
