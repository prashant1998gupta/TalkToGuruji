// Site navigation. URLs mirror the old talktoguruji.com paths so existing links and SEO keep working.

export type NavLink = { label: string; href: string; desc?: string; icon?: string };
export type NavGroup = { label: string; href?: string; columns?: { title: string; links: NavLink[] }[] };

export const NAV: NavGroup[] = [
  {
    label: 'Consult',
    columns: [
      {
        title: 'Talk to an expert',
        links: [
          { label: 'Chat with Astrologer', href: '/astrology-services/chat-with-astrologer', desc: 'Instant private chat, pay per minute', icon: 'MessageCircle' },
          { label: 'Talk to Astrologer', href: '/astrology-services/talk-to-astrologer', desc: 'Voice call in your language', icon: 'Phone' },
          { label: 'Video Consultation', href: '/astrology-services/video-consultation', desc: 'Face-to-face reading', icon: 'Video' },
          { label: 'Guruji Live', href: '/astrology-services/live-astrologers', desc: 'Astrologers online right now', icon: 'Radio' },
        ],
      },
      {
        title: 'Puja & Rituals',
        links: [
          { label: 'Online Puja Booking', href: '/astrology-services/online-pooja-booking', desc: 'Performed by Vedic pandits', icon: 'Flame' },
          { label: 'Online & Offline Katha', href: '/astrology-services/online-katha-booking', icon: 'BookOpen' },
          { label: 'Live Aarti Darshan', href: '/live-aarti-darshan', icon: 'Sparkles' },
          { label: 'Live Temple Darshan', href: '/live-temple-darshan', icon: 'Landmark' },
        ],
      },
    ],
  },
  {
    label: 'Free Tools',
    columns: [
      {
        title: 'Your chart',
        links: [
          { label: 'Free Kundli', href: '/astrology-services/free-kundli', desc: 'Birth chart, dashas & doshas', icon: 'Orbit' },
          { label: 'Kundli Matching', href: '/astrology-services/kundli-matching', desc: '36-guna compatibility', icon: 'HeartHandshake' },
          { label: 'Today’s Panchang', href: '/astrology-services/panchang', desc: 'Tithi, nakshatra, muhurat', icon: 'CalendarDays' },
          { label: 'Planetary Transits', href: '/transits', desc: 'Where the grahas are now', icon: 'Globe2' },
        ],
      },
      {
        title: 'Explore',
        links: [
          { label: 'Numerology', href: '/numerology', icon: 'Hash' },
          { label: 'Tarot Cards', href: '/tarot', icon: 'Layers' },
          { label: 'Vastu Shastra', href: '/vastu', icon: 'Compass' },
          { label: 'Planet Remedies', href: '/remedies', icon: 'Sun' },
        ],
      },
    ],
  },
  {
    label: 'Horoscope',
    columns: [
      {
        title: 'Rashifal',
        links: [
          { label: 'Daily Horoscope', href: '/horoscope/daily', icon: 'Sunrise' },
          { label: 'Weekly Horoscope', href: '/horoscope/weekly', icon: 'CalendarRange' },
          { label: 'Monthly Horoscope', href: '/horoscope/monthly', icon: 'Calendar' },
          { label: 'Yearly Horoscope', href: '/horoscope/yearly', icon: 'Star' },
        ],
      },
    ],
  },
  {
    label: 'Rituals',
    columns: [
      {
        title: 'Devotion',
        links: [
          { label: 'Vrats', href: '/rituals/vrats', icon: 'Moon' },
          { label: 'Festivals', href: '/rituals/festivals', icon: 'PartyPopper' },
          { label: 'Aarti', href: '/rituals/aarti', icon: 'Flame' },
          { label: 'Bhajan', href: '/rituals/bhajan', icon: 'Music' },
        ],
      },
    ],
  },
  {
    label: 'Learn',
    columns: [
      {
        title: 'Read & watch',
        links: [
          { label: 'Blogs', href: '/blogs', icon: 'Newspaper' },
          { label: 'Astrology News', href: '/astrology-news', icon: 'Megaphone' },
          { label: 'Videos', href: '/videos', icon: 'PlayCircle' },
          { label: 'Web Stories', href: '/web-stories', icon: 'GalleryHorizontal' },
          { label: 'Photo Gallery', href: '/photo-gallery', icon: 'Images' },
          { label: 'Audio Podcast', href: '/audio-podcast', icon: 'Headphones' },
        ],
      },
    ],
  },
  { label: 'Astro Mart', href: '/astro-mart' },
];

export const FOOTER: { title: string; links: NavLink[] }[] = [
  {
    title: 'Astrology Services',
    links: [
      { label: 'Talk to Astrologer', href: '/astrology-services/talk-to-astrologer' },
      { label: 'Chat with Astrologer', href: '/astrology-services/chat-with-astrologer' },
      { label: 'Free Kundli', href: '/astrology-services/free-kundli' },
      { label: 'Kundli Matching', href: '/astrology-services/kundli-matching' },
      { label: 'Panchang', href: '/astrology-services/panchang' },
      { label: 'Guruji Live', href: '/astrology-services/live-astrologers' },
      { label: 'Online Puja Booking', href: '/astrology-services/online-pooja-booking' },
      { label: 'Online & Offline Katha Booking', href: '/astrology-services/online-katha-booking' },
    ],
  },
  {
    title: 'Rituals & Remedies',
    links: [
      { label: 'Vrat', href: '/rituals/vrats' },
      { label: 'Festivals', href: '/rituals/festivals' },
      { label: 'Bhajan', href: '/rituals/bhajan' },
      { label: 'Aarti', href: '/rituals/aarti' },
      { label: 'Sun Remedies', href: '/remedies/sun-remedies' },
      { label: 'Moon Remedies', href: '/remedies/moon-remedies' },
      { label: 'Jupiter Remedies', href: '/remedies/jupiter-remedies' },
      { label: 'Rahu Remedies', href: '/remedies/rahu-remedies' },
    ],
  },
  {
    title: 'Videos & Live',
    links: [
      { label: 'Videos', href: '/videos' },
      { label: 'Audio Podcast', href: '/audio-podcast' },
      { label: 'Web Stories', href: '/web-stories' },
      { label: 'Photo Gallery', href: '/photo-gallery' },
      { label: 'Live Aarti Darshan', href: '/live-aarti-darshan' },
      { label: 'Live Temple Darshan', href: '/live-temple-darshan' },
      { label: 'Subscription Plans', href: '/subscription-plan' },
      { label: 'Planetary Transits', href: '/transits' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about-us' },
      { label: 'Blogs', href: '/blogs' },
      { label: 'Contact Us', href: '/contact-us' },
      { label: 'Join As Astrologer', href: '/astro-registration' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
      { label: 'Astrologer Terms', href: '/astrologer-terms-and-condition' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
    ],
  },
];

export const CONTACT = {
  address: 'ALtF 142 NOIDA, Plot no. 21 and 21A. Sector 142, Maharishi Nagar, Noida, Gautam Buddha Nagar- 201304, Uttar Pradesh, India',
  email: 'info@Talktoguruji.com',
  company: 'Inno-one Service LLP',
  social: { facebook: 'https://www.facebook.com/talktoguruji.live', x: 'https://x.com/talktoguruji', instagram: 'https://www.instagram.com/talktoguruji.live' },
};
