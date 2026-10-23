import Link from 'next/link';
import type { Metadata } from 'next';
import { Clock, Mail, MapPin, MessageCircle } from 'lucide-react';
import { PageHero } from '@/components/ui/primitives';
import { ContactForm } from '@/components/content/ContactForm';
import { getContact } from '@/lib/settings';

export const metadata: Metadata = { title: 'Contact Us', description: 'Get in touch with Talk to Guruji.' };

export default async function ContactPage() {
  const CONTACT = await getContact();
  return (
    <>
      <PageHero eyebrow="Contact Us" title="Get in touch with us" intro="If you have any further questions or queries, please do not hesitate to get in touch." crumbs={[{ label: 'Contact Us' }]} />
      <section className="container-x grid gap-8 py-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {[
            { icon: MapPin, t: 'Address', d: CONTACT.address },
            { icon: Mail, t: 'Email Address', d: <a href={`mailto:${CONTACT.email}`} className="text-saffron-700 hover:underline">{CONTACT.email}</a> },
            { icon: Clock, t: 'Support hours', d: '7 days a week, including festivals' },
          ].map(({ icon: I, t, d }) => (
            <div key={t} className="card flex gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-saffron-50 text-saffron-600"><I className="h-5 w-5" /></span>
              <div><p className="font-semibold">{t}</p><div className="mt-0.5 text-sm leading-relaxed text-muted">{d}</div></div>
            </div>
          ))}
          <div className="night rounded-3xl p-6">
            <p className="font-display text-xl font-semibold text-white">Need an answer right now?</p>
            <p className="mt-1 text-sm text-white/60">Astrologers are online 24×7.</p>
            <Link href="/astrology-services/chat-with-astrologer" className="btn-gold mt-4"><MessageCircle className="h-4 w-4" /> Chat with Astrologer</Link>
          </div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
