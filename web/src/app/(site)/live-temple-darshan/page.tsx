import type { Metadata } from 'next';
import { Flame, Sparkles, Radio } from 'lucide-react';
import { ComingSoon } from '@/components/content/ComingSoon';

export const metadata: Metadata = { title: 'Live Temple Darshan', description: 'Live darshan from prominent temples across India.' };

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Live Temple Darshan"
      title="Darshan from India’s sacred temples"
      intro="A virtual temple experience — feel the presence and energy of the divine from the comfort of your home, with live streams from prominent temples of Lord Shiva, Durga, Hanuman, Vishnu and more."
      crumbs={[{ label: 'Live Temple Darshan' }]}
      highlights={['Live streams from major temples', 'Festival-day special darshan', 'Book a puja at the temple', 'Prasad delivered home']}
      related={[
        { href: '/live-aarti-darshan', label: 'Live Aarti Darshan', desc: 'Join aartis in real time', icon: Sparkles },
        { href: '/astrology-services/online-pooja-booking', label: 'Book a Puja', desc: 'Performed by Vedic pandits', icon: Flame },
        { href: '/astrology-services/live-astrologers', label: 'Guruji Live', desc: 'Astrologers online now', icon: Radio },
      ]}
    />
  );
}
