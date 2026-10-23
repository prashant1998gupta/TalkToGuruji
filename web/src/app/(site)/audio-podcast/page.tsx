import type { Metadata } from 'next';
import { Flame, MessageCircle, PlayCircle } from 'lucide-react';
import { ComingSoon } from '@/components/content/ComingSoon';

export const metadata: Metadata = { title: 'Audio Podcast', description: 'Listen to astrology, spirituality and remedies podcasts by Talk to Guruji.' };

export default function Page() {
  return (
    <ComingSoon
      eyebrow="Audio Podcast"
      title="Guruji, in your ears"
      intro="Short episodes on planetary transits, remedies, festivals and spiritual living — to listen to on your morning walk or evening commute."
      crumbs={[{ label: 'Audio Podcast' }]}
      highlights={['Weekly rashifal in Hindi & English', 'Festival stories and their meaning', 'Remedy explainers by our astrologers', 'Listen on any device']}
      related={[
        { href: '/videos', label: 'Watch videos', desc: 'Predictions & remedies on video', icon: PlayCircle },
        { href: '/rituals/aarti', label: 'Read aartis', desc: 'Complete lyrics for daily puja', icon: Flame },
        { href: '/astrology-services/chat-with-astrologer', label: 'Chat with Astrologer', desc: 'Get personal answers now', icon: MessageCircle },
      ]}
    />
  );
}
