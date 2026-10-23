import type { Metadata } from 'next';
import { MessageCircle, Orbit, Wallet } from 'lucide-react';
import { ComingSoon } from '@/components/content/ComingSoon';

export const metadata: Metadata = { title: 'Subscription Plans', description: 'Upgrade to Premium Membership on Talk to Guruji.' };

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Premium Membership"
      title="Upgrade to Premium Membership"
      intro="Discounted consultation minutes, detailed premium kundli reports and priority access to top astrologers — all in one membership."
      crumbs={[{ label: 'Subscription Plans' }]}
      highlights={['Discounted per-minute rates', 'Premium kundli & dasha reports', 'Priority queue with top astrologers', 'Exclusive puja offers']}
      related={[
        { href: '/wallet', label: 'Recharge wallet', desc: 'Bonus credit on every pack', icon: Wallet },
        { href: '/astrology-services/free-kundli', label: 'Free Kundli', desc: 'Your complete birth chart', icon: Orbit },
        { href: '/astrology-services/chat-with-astrologer', label: 'Chat with Astrologer', desc: 'First minutes free with select experts', icon: MessageCircle },
      ]}
    />
  );
}
