import type { Metadata } from 'next';
import { ListingPage, KundliSeoCopy } from '@/components/consult/ListingPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Chat with Astrologer Online', description: 'Chat online with verified Vedic, KP, Tarot and Numerology astrologers. Pay per minute, private and instant.' };

export default function Page() {
  return <ListingPage mode="CHAT" eyebrow="Chat consultation" crumb="Chat with Astrologer" title="Chat with an astrologer, privately and instantly" intro="Type your question, share your birth details and get guidance from verified astrologers. Keep the full transcript forever." seo={<KundliSeoCopy />} />;
}
