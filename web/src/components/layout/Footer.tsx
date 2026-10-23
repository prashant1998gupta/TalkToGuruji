import Link from 'next/link';
import { Mail, MapPin, ShieldCheck, Lock, BadgeCheck } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { FOOTER } from '@/lib/nav';
import { getContact } from '@/lib/settings';

export async function Footer() {
  const CONTACT = await getContact();
  return (
    <footer className="night relative mt-20 overflow-hidden pb-24 lg:pb-0">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="container-x relative">
        <div className="grid gap-8 border-b border-white/10 py-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow !text-gold-300">Stay aligned</p>
            <h2 className="h-display mt-2 text-3xl text-white sm:text-4xl">Subscribe to our newsletter</h2>
            <p className="mt-2 max-w-md text-sm text-white/60">Weekly rashifal, festival dates and remedies — straight to your inbox. No spam, ever.</p>
          </div>
          <NewsletterForm />
        </div>

        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <Logo dark />
            <p className="text-sm leading-relaxed text-white/60">
              Authentic Vedic guidance from verified astrologers — chat, call or video, plus pujas, kundli and remedies, all in one place.
            </p>
            <div className="space-y-2.5 text-sm text-white/70">
              <p className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />{CONTACT.address}</p>
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2.5 hover:text-gold-300"><Mail className="h-4 w-4 text-gold-400" />{CONTACT.email}</a>
            </div>
            <div className="flex gap-2 pt-1">
              {Object.entries(CONTACT.social).map(([k, href]) => (
                <a key={k} href={href} target="_blank" rel="noreferrer" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-xs font-bold uppercase text-white/80 ring-1 ring-white/10 transition hover:bg-saffron-500 hover:text-white" aria-label={k}>
                  {k === 'facebook' ? 'f' : k === 'x' ? '𝕏' : 'ig'}
                </a>
              ))}
            </div>
          </div>
          {FOOTER.map((col) => (
            <div key={col.title}>
              <p className="mb-3 text-sm font-bold text-gold-300">{col.title}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/60 transition hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6 text-xs text-white/50">
          <p>© {new Date().getFullYear()} {CONTACT.company} | All Rights Reserved.</p>
          <div className="flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-leaf" /> Private & confidential</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-gold-400" /> Verified astrologers</span>
            <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-white/60" /> Secure payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
