import type { Metadata } from 'next';
import { Flame, Landmark, Radio } from 'lucide-react';
import { ComingSoon } from '@/components/content/ComingSoon';

export const metadata: Metadata = { title: 'Live Aarti Darshan', description: 'Participate in real-time aarti ceremonies streamed live from sacred temples across India.' };

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Live Aarti Darshan"
      title="Join the aarti, wherever you are"
      intro="Participate in real-time Aarti ceremonies streamed live from sacred temples across India. Devotees can request to include their name or Gotra for Sankalp before the Aarti begins."
      crumbs={[{ label: 'Live Aarti Darshan' }]}
      highlights={['Daily morning & evening aartis', 'Special festival aartis', 'Sankalp in your name & gotra', 'No app needed — stream in your browser']}
      related={[
        { href: '/rituals/aarti', label: 'Aarti lyrics', desc: 'Sing along with the aarti', icon: Flame },
        { href: '/live-temple-darshan', label: 'Live Temple Darshan', desc: 'Darshan from famous temples', icon: Landmark },
        { href: '/astrology-services/live-astrologers', label: 'Guruji Live', desc: 'Astrologers online now', icon: Radio },
      ]}
    />
  );
}
