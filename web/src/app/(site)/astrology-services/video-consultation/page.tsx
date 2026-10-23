import type { Metadata } from 'next';
import { ListingPage, KundliSeoCopy } from '@/components/consult/ListingPage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Video Consultation with Astrologer', description: 'Face-to-face video consultations with verified astrologers from the comfort of your home.' };

export default function Page() {
  return <ListingPage mode="VIDEO" eyebrow="Video consultation" crumb="Video Consultation" title="See your astrologer, face to face" intro="A personal video reading for palmistry, face reading or simply a more human conversation — from anywhere." seo={<KundliSeoCopy />} />;
}
