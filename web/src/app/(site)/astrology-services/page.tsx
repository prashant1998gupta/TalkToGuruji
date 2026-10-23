import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, BookOpen, CalendarDays, Flame, HeartHandshake, MessageCircle, Orbit, Phone, Radio, Video } from 'lucide-react';
import { PageHero } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Astrology Services',
  description: 'Talk to astrologer, chat with astrologer, free kundli, kundli matching, panchang, Guruji live, puja booking and katha booking.',
};

const SERVICES = [
  { href: '/astrology-services/talk-to-astrologer', title: 'Talk to Astrologer', desc: 'Voice consultations with verified Vedic, KP and Tarot experts in your language.', icon: Phone, tag: 'Pay per minute' },
  { href: '/astrology-services/chat-with-astrologer', title: 'Chat With Astrologer', desc: 'Private, instant chat — type at your own pace and keep the transcript.', icon: MessageCircle, tag: 'Most popular' },
  { href: '/astrology-services/video-consultation', title: 'Video Consultation', desc: 'A face-to-face reading from home, with screen-free clarity.', icon: Video },
  { href: '/astrology-services/free-kundli', title: 'Free Kundli', desc: 'Your birth chart with planetary positions, nakshatra, dashas and doshas.', icon: Orbit, tag: 'Free' },
  { href: '/astrology-services/kundli-matching', title: 'Kundli Matching', desc: 'Ashtakoot guna milan out of 36 with manglik check for marriage.', icon: HeartHandshake, tag: 'Free' },
  { href: '/astrology-services/panchang', title: 'Panchang', desc: 'Tithi, nakshatra, yoga, karana, sunrise and Rahu kaal for any day and city.', icon: CalendarDays, tag: 'Free' },
  { href: '/astrology-services/live-astrologers', title: 'Guruji Live', desc: 'See who is online right now and connect in seconds.', icon: Radio },
  { href: '/astrology-services/online-pooja-booking', title: 'Puja Booking', desc: 'Pujas performed in your name by Vedic pandits, live on video.', icon: Flame },
  { href: '/astrology-services/online-katha-booking', title: 'Online & Offline Katha Booking', desc: 'Satyanarayan, Bhagwat and Ramayan kathas — online or at your home.', icon: BookOpen, tag: 'Coming soon' },
];

export default function ServicesHub() {
  return (
    <>
      <PageHero
        eyebrow="Talk to Guruji"
        title="Astrology Services"
        intro="At Talk to Guruji, we inspire and guide individuals through the wisdom of astrology and holistic practices. Our expert astrologers offer personalized insights to help you navigate life's journey with clarity, confidence, and purpose. Join our vibrant community and unlock the transformative power of knowledge, self-discovery, and meaningful connections. 🌿✨"
        crumbs={[{ label: 'Astrology Services' }]}
      />
      <section className="container-x grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ href, title, desc, icon: I, tag }) => (
          <Link key={href} href={href} className="card-hover group relative flex flex-col overflow-hidden p-6">
            <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br from-saffron-100 to-transparent transition group-hover:scale-125" />
            <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-night-900 text-gold-300 transition group-hover:bg-saffron-500 group-hover:text-white"><I className="h-5 w-5" /></span>
            {tag && <span className="absolute right-5 top-5 rounded-full bg-cream-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink/70">{tag}</span>}
            <h2 className="relative mt-5 font-display text-xl font-semibold text-night-900">{title}</h2>
            <p className="relative mt-1.5 flex-1 text-sm text-muted">{desc}</p>
            <span className="relative mt-5 flex items-center gap-1 text-sm font-bold text-saffron-600">Explore <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </Link>
        ))}
      </section>
    </>
  );
}
