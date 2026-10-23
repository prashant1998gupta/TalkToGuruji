import type { Metadata } from 'next';
import { StaticPage } from '@/components/content/StaticPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Refund Policy' };

export default function Page() {
  return <StaticPage slug="refund-policy" eyebrow="Legal" />;
}
