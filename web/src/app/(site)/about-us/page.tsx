import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BadgeCheck, Compass, HeartHandshake, Languages, Lock, MessageCircle, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { PageHero } from '@/components/ui/primitives';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'About Us', description: 'Talk to Guruji is your trusted destination for authentic astrology guidance and personalized predictions.' };

const VALUES = [
  { icon: Compass, t: 'Clarity & purpose', d: 'Guidance that helps you make informed decisions aligned with your goals and cosmic influences.' },
  { icon: HeartHandshake, t: 'Compassion', d: 'Every consultation begins with listening. Your concerns are personal and treated that way.' },
  { icon: BadgeCheck, t: 'Integrity & precision', d: 'Verified astrologers, thoroughly researched insights and honest remedies — never fear.' },
  { icon: Languages, t: 'In your language', d: 'Hindi, English and regional languages so nothing is lost in translation.' },
  { icon: Lock, t: 'Private by design', d: 'Encrypted consultations; your birth details are never sold or shared.' },
  { icon: Sparkles, t: 'Holistic', d: 'Kundli, horoscope, panchang, pujas and remedies — one spiritual home.' },
];

export default async function AboutPage() {
  const page = await db.page.findUnique({ where: { slug: 'about-us' } });
  if (!page) notFound();
  const [astros, contents] = await Promise.all([db.astrologer.count({ where: { status: 'APPROVED' } }), db.content.count({ where: { published: true } })]);
  return (
    <>
      <PageHero eyebrow="About Us" title="Your Spiritual Guide" intro="Authentic astrology guidance and personalized predictions — dedicated to guiding you toward clarity, purpose and well-being." crumbs={[{ label: 'About Us' }]} />
      <section className="container-x grid gap-10 py-14 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <div className="prose-guru text-[16.5px]" dangerouslySetInnerHTML={{ __html: page.body }} />
        <div className="grid grid-cols-2 gap-4">
          {[[`${astros}+`, 'Verified astrologers'], ['50k+', 'Consultations'], [`${contents}+`, 'Articles & guides'], ['24×7', 'Always available']].map(([v, l]) => (
            <div key={l} className="card p-6">
              <p className="font-display text-4xl font-semibold text-saffron-600">{v}</p>
              <p className="mt-1 text-sm text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="night section">
        <div className="container-x">
          <p className="eyebrow !text-gold-300">What we stand for</p>
          <h2 className="h-display mt-2 text-3xl text-white sm:text-4xl">Ancient wisdom, modern care</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map(({ icon: I, t, d }) => (
              <div key={t} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <I className="h-6 w-6 text-gold-300" />
                <p className="mt-4 font-display text-xl font-semibold text-white">{t}</p>
                <p className="mt-1.5 text-sm text-white/60">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/astrology-services/chat-with-astrologer" className="btn-gold btn-lg"><MessageCircle className="h-5 w-5" /> Talk to an astrologer</Link>
            <Link href="/contact-us" className="btn btn-lg border border-white/20 bg-white/5 text-white hover:bg-white/10">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
