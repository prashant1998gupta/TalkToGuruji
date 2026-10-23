import type { Metadata } from 'next';
import { StaticPage } from '@/components/content/StaticPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Astrologer Terms & Conditions' };

export default function Page() {
  return <StaticPage slug="astrologer-terms" eyebrow="Legal" />;
}
