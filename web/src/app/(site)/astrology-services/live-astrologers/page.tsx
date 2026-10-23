import type { Metadata } from 'next';
import { ListingPage } from '@/components/consult/ListingPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Guruji Live — Astrologers Online Now' };

export default function Page() {
  return <ListingPage mode="CHAT" allModes onlineOnly eyebrow="Guruji Live" crumb="Guruji Live" title="Astrologers online right now" intro="Connect instantly by chat, call or video with the astrologers who are available this minute. Statuses update live." />;
}
