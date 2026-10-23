import type { Metadata } from 'next';
import { ListingPage, KundliSeoCopy } from '@/components/consult/ListingPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Talk to Astrologer on Call', description: 'Talk to an astrologer on a voice call in Hindi, English and regional languages. Unlock the secrets of your destiny.' };

export default function Page() {
  return <ListingPage mode="CALL" eyebrow="Voice call" crumb="Talk to Astrologer" title="Talk To An Astrologer: Unlock The Secrets Of Your Destiny" intro="Speak directly with experienced astrologers in your own language. Billed per minute from your wallet — end anytime." seo={<KundliSeoCopy />} />;
}
