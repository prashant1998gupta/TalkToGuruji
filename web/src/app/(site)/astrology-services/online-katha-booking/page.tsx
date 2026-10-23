import type { Metadata } from 'next';
import { Flame, Landmark, Phone } from 'lucide-react';
import { ComingSoon } from '@/components/content/ComingSoon';

export const metadata: Metadata = { title: 'Online & Offline Katha Booking', description: 'Book online and offline Katha sessions — Satyanarayan, Bhagwat, Ramayan and more.' };

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Online & Offline Katha"
      title="Online & Offline Katha"
      intro="Join us for immersive online and offline Katha sessions that bring spiritual stories to life. Experience the wisdom of ancient texts and connect with a community of seekers. Whether virtual or in-person, each session offers a unique journey of discovery and devotion."
      crumbs={[{ label: 'Astrology Services', href: '/astrology-services' }, { label: 'Katha Booking' }]}
      highlights={['Satyanarayan Katha', 'Shrimad Bhagwat Katha', 'Sunderkand & Ramayan path', 'At your home or online']}
      related={[
        { href: '/astrology-services/online-pooja-booking', label: 'Book a Puja', desc: 'Available today', icon: Flame },
        { href: '/live-temple-darshan', label: 'Temple Darshan', desc: 'Live from sacred temples', icon: Landmark },
        { href: '/astrology-services/talk-to-astrologer', label: 'Talk to Astrologer', desc: 'Find an auspicious muhurat', icon: Phone },
      ]}
    />
  );
}
