import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, CalendarDays, Flame, HeartHandshake, Lock, MessageCircle, Orbit, Phone, PlayCircle, Quote, ShoppingBag,
  Sparkles, Star, Sunrise, Video,
} from 'lucide-react';
import { db } from '@/lib/db';
import { approvedAstrologers } from '@/lib/queries';
import { HeroVisual } from '@/components/three/HeroVisual';
import { AstroRail } from '@/components/consult/AstroRail';
import { ContentCard } from '@/components/ui/ContentCard';
import { SectionHeading } from '@/components/ui/primitives';
import { Faq } from '@/components/ui/Faq';
import { TodayPanchangCard } from '@/components/astro/TodayPanchangCard';
import { SIGNS } from '@/lib/zodiac';
import { inr, json, readingTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const SERVICES = [
  { href: '/astrology-services/free-kundli', label: 'Free Kundli', desc: 'Birth chart & dashas', icon: Orbit, tint: 'bg-night-900 text-gold-300' },
  { href: '/astrology-services/kundli-matching', label: 'Kundli Matching', desc: '36 gunas compatibility', icon: HeartHandshake, tint: 'bg-rose/10 text-rose' },
  { href: '/horoscope/daily', label: 'Today’s Horoscope', desc: 'For all 12 rashis', icon: Sunrise, tint: 'bg-saffron-50 text-saffron-600' },
  { href: '/astrology-services/panchang', label: 'Today Panchang', desc: 'Tithi, nakshatra, muhurat', icon: CalendarDays, tint: 'bg-gold-300/30 text-gold-500' },
  { href: '/astrology-services/online-pooja-booking', label: 'Book Puja Online', desc: 'By Vedic pandits', icon: Flame, tint: 'bg-saffron-500 text-white' },
  { href: '/astro-mart', label: 'Astro Mart', desc: 'Energised gems & yantras', icon: ShoppingBag, tint: 'bg-leaf/10 text-leaf' },
];

export default async function HomePage() {
  const [{ cards, statuses }, blogs, news, stories, videos, pujas, testimonials, faqs] = await Promise.all([
    approvedAstrologers(),
    db.content.findMany({ where: { type: 'blog', published: true }, orderBy: { createdAt: 'desc' }, take: 6 }),
    db.content.findMany({ where: { type: 'news', published: true }, orderBy: { createdAt: 'desc' }, take: 4 }),
    db.content.findMany({ where: { type: 'story', published: true }, orderBy: { createdAt: 'desc' }, take: 6 }),
    db.content.findMany({ where: { type: 'video', published: true }, orderBy: { createdAt: 'desc' }, take: 4 }),
    db.puja.findMany({ where: { active: true }, orderBy: [{ tier: 'desc' }, { createdAt: 'desc' }], take: 4 }),
    db.testimonial.findMany({ orderBy: { createdAt: 'asc' } }),
    db.faq.findMany({ orderBy: { sort: 'asc' }, take: 8 }),
  ]);
  const onlineCount = Object.values(statuses).filter((s) => s.isOnline).length;

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="night relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:36px_36px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="container-x relative grid items-center gap-6 py-12 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-gold-300 ring-1 ring-white/10">
              <span className="h-2 w-2 animate-pulse-ring rounded-full bg-leaf" /> {onlineCount} astrologers online now
            </p>
            <h1 className="h-display mt-5 text-[2.6rem] leading-[1.04] text-white sm:text-6xl lg:text-[4.1rem]">
              Clarity from the stars,
              <span className="block bg-gradient-to-r from-gold-300 via-saffron-300 to-saffron-500 bg-clip-text italic text-transparent">guidance from Guruji.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              Personalized Vedic astrology, horoscopes and consultations online. Chat, call or video with verified astrologers — in your language, any time of day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/astrology-services/chat-with-astrologer" className="btn-gold btn-lg"><MessageCircle className="h-5 w-5" /> Chat with Astrologer</Link>
              <Link href="/astrology-services/talk-to-astrologer" className="btn btn-lg border border-white/20 bg-white/5 text-white hover:bg-white/10"><Phone className="h-5 w-5" /> Talk to Astrologer</Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[['4.8★', 'Average rating'], ['50k+', 'Consultations'], ['24×7', 'Always available']].map(([v, l]) => (
                <div key={l}>
                  <dt className="font-display text-2xl font-semibold text-white sm:text-3xl">{v}</dt>
                  <dd className="text-xs text-white/55">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroVisual className="mx-auto aspect-square w-full max-w-[560px] lg:max-w-none" />
        </div>
      </section>

      {/* ---------- Quick services ---------- */}
      <section className="container-x relative z-10 -mt-8">
        <div className="grid grid-cols-2 gap-3 rounded-3xl border border-line bg-white p-3 shadow-lift sm:grid-cols-3 lg:grid-cols-6">
          {SERVICES.map(({ href, label, desc, icon: I, tint }) => (
            <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-cream-100 lg:flex-col lg:items-start lg:p-4">
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition group-hover:scale-110 ${tint}`}><I className="h-5 w-5" /></span>
              <span>
                <span className="block text-sm font-bold text-night-900">{label}</span>
                <span className="block text-xs text-muted">{desc}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Live astrologers ---------- */}
      <section className="section container-x">
        <SectionHeading eyebrow="Guruji Live" title="Talk to India’s trusted astrologers" intro="Verified experts in Vedic, KP, Tarot, Numerology and Vastu. Green means available right now." action={{ label: 'View all', href: '/astrology-services/chat-with-astrologer' }} />
        <AstroRail astrologers={cards} statuses={statuses} />
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { href: '/astrology-services/chat-with-astrologer', icon: MessageCircle, t: 'Chat consultation', d: 'Type at your own pace, keep the transcript.' },
            { href: '/astrology-services/talk-to-astrologer', icon: Phone, t: 'Voice call', d: 'Talk it through in your own language.' },
            { href: '/astrology-services/video-consultation', icon: Video, t: 'Video call', d: 'A face-to-face reading from home.' },
          ].map(({ href, icon: I, t, d }) => (
            <Link key={href} href={href} className="card-hover flex items-center gap-4 p-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-night-900 text-gold-300"><I className="h-5 w-5" /></span>
              <span className="flex-1"><span className="block font-semibold">{t}</span><span className="text-xs text-muted">{d}</span></span>
              <ArrowRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Horoscope wheel ---------- */}
      <section className="night section relative overflow-hidden">
        <div className="container-x relative">
          <div className="mb-10 text-center">
            <p className="eyebrow !text-gold-300">Rashifal</p>
            <h2 className="h-display mt-2 text-3xl text-white sm:text-5xl">Choose your zodiac sign</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/60">Daily, weekly, monthly and yearly predictions for love, career, health and luck.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {SIGNS.map((s) => (
              <Link
                key={s.slug}
                href={`/horoscope/daily/${s.slug}`}
                className="group relative flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] px-2 py-5 text-center transition duration-300 [transform-style:preserve-3d] hover:-translate-y-1 hover:border-gold-400/50 hover:bg-white/[0.07] hover:[transform:perspective(600px)_rotateX(8deg)]"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold-300/20 to-saffron-500/10 font-['Segoe_UI_Symbol','Noto_Sans_Symbols_2',serif] text-[34px] text-gold-300 ring-1 ring-gold-400/30 transition group-hover:scale-110 group-hover:text-gold-300">
                  {s.glyph}
                </span>
                <span className="mt-3 font-display text-lg font-semibold text-white">{s.name}</span>
                <span className="text-[11px] text-white/50">{s.hindi} · {s.dates}</span>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
              <Link key={p} href={`/horoscope/${p}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold capitalize text-white/80 transition hover:border-gold-400 hover:text-gold-300">
                {p} horoscope
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Pujas ---------- */}
      <section className="section container-x">
        <SectionHeading eyebrow="Online Puja" title="Pujas performed in your name" intro="Sankalp with your name and gotra, live video of the ritual, and prasad delivered home." action={{ label: 'All pujas', href: '/astrology-services/online-pooja-booking' }} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {pujas.map((p, i) => (
            <Link key={p.id} href={`/puja/${p.slug}`} className="card-hover group overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="(max-width:640px) 100vw, 25vw" className="object-cover transition duration-700 group-hover:scale-105" priority={i < 2} />}
                {p.tier === 'vip' && <span className="absolute left-3 top-3 rounded-full bg-night-900/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-300">VIP Puja</span>}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 font-display text-lg font-semibold text-night-900">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{p.excerpt}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p><b className="text-night-900">{inr(p.price)}</b>{p.mrp > p.price && <span className="ml-1.5 text-xs text-muted line-through">{inr(p.mrp)}</span>}</p>
                  <span className="text-xs font-bold text-saffron-600 group-hover:underline">Book now →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="container-x">
        <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-saffron-50 via-cream-50 to-gold-300/30 p-6 ring-1 ring-saffron-100 sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <p className="eyebrow">How it works</p>
            <h2 className="h-display mt-2 text-3xl text-night-900 sm:text-4xl">Your first reading in under two minutes</h2>
            <p className="mt-3 text-muted">Transparent per-minute pricing. Recharge your wallet once, end the session whenever you like, and keep the chat transcript forever.</p>
            <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold text-ink/80">
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-leaf" /> Private & secure</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-saffron-600" /> Verified experts</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-gold-400 text-gold-400" /> Honest reviews</span>
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              ['Pick an astrologer', 'Filter by skill, language, rating and price.'],
              ['Share birth details', 'Date, time and place — your chart is ready before you connect.'],
              ['Chat, call or video', 'Get answers and remedies. Pay only for the minutes you use.'],
            ].map(([t, d], i) => (
              <li key={t} className="rounded-3xl bg-white p-5 shadow-soft">
                <span className="font-display text-4xl font-semibold text-saffron-500/90">{i + 1}</span>
                <p className="mt-2 font-semibold text-night-900">{t}</p>
                <p className="mt-1 text-sm text-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Blogs ---------- */}
      <section className="section container-x">
        <SectionHeading eyebrow="From Guruji’s desk" title="Our latest blogs" action={{ label: 'View all blogs', href: '/blogs' }} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.map((b) => (
            <ContentCard key={b.id} href={`/blogs/${b.slug}`} title={b.title} image={b.image} excerpt={b.excerpt} tag={b.category} date={b.createdAt} meta={`${readingTime(b.body)} min read`} />
          ))}
        </div>
      </section>

      {/* ---------- News + stories ---------- */}
      <section className="container-x grid gap-10 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <SectionHeading eyebrow="Cosmic headlines" title="Latest astrology news" action={{ label: 'All news', href: '/astrology-news' }} />
          <div className="space-y-3">
            {news.map((n) => (
              <Link key={n.id} href={`/astrology-news/${n.slug}`} className="card-hover group flex gap-4 p-3">
                <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:w-40">
                  {n.image && <Image src={n.image} alt="" fill sizes="160px" className="object-cover" />}
                </div>
                <div className="min-w-0 py-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-saffron-600">{n.author}</p>
                  <h3 className="mt-1 line-clamp-2 font-semibold leading-snug text-night-900 group-hover:text-saffron-700">{n.title}</h3>
                  <p className="mt-1 text-xs text-muted">{n.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div>
          <SectionHeading eyebrow="Swipe through" title="Web stories" action={{ label: 'All', href: '/web-stories' }} />
          <div className="grid grid-cols-3 gap-3">
            {stories.map((s) => (
              <Link key={s.id} href={`/web-stories/${s.slug}`} className="group relative aspect-[9/14] overflow-hidden rounded-2xl bg-night-900 ring-2 ring-saffron-400/70 ring-offset-2 ring-offset-cream-100">
                {s.image && <Image src={s.image} alt={s.title} fill sizes="160px" className="object-cover opacity-90 transition duration-700 group-hover:scale-105" />}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-8 text-[11px] font-semibold leading-tight text-white line-clamp-3">{s.title}</span>
              </Link>
            ))}
          </div>
          <TodayPanchangCard className="mt-6" />
        </div>
      </section>

      {/* ---------- Videos ---------- */}
      <section className="section container-x">
        <SectionHeading eyebrow="Watch" title="Videos by Talk to Guruji" action={{ label: 'All videos', href: '/videos' }} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {videos.map((v) => (
            <Link key={v.id} href={`/videos/${v.slug}`} className="group">
              <div className="relative aspect-video overflow-hidden rounded-2xl bg-night-900">
                {v.image && <Image src={v.image} alt={v.title} fill sizes="(max-width:640px) 100vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-80" />}
                <span className="absolute inset-0 grid place-items-center"><PlayCircle className="h-12 w-12 text-white drop-shadow-lg transition group-hover:scale-110" /></span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-night-900 group-hover:text-saffron-700">{v.title}</p>
              {json<{ videoUrl?: string }>(v.extra, {}).videoUrl && <p className="mt-0.5 text-xs text-muted">YouTube</p>}
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="night section relative overflow-hidden">
        <div className="container-x">
          <div className="mb-10 text-center">
            <p className="eyebrow !text-gold-300">Our testimonial</p>
            <h2 className="h-display mt-2 text-3xl text-white sm:text-4xl">Words from seekers like you</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <figure key={t.id} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <Quote className="h-7 w-7 text-saffron-400" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-white/80">{t.body}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-saffron-500 font-bold text-night-900">{t.name[0]}</span>
                  <span><span className="block text-sm font-semibold text-white">{t.name}</span><span className="text-xs text-white/50">{t.profession}</span></span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- FAQ + CTA ---------- */}
      <section className="section container-x grid gap-10 lg:grid-cols-[1fr_1.5fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="eyebrow">FAQ</p>
          <h2 className="h-display mt-2 text-3xl text-night-900 sm:text-4xl">Frequently asked questions</h2>
          <p className="mt-3 text-muted">Everything about consultations, kundli, pujas and Astro Mart.</p>
          <div className="mt-8 overflow-hidden rounded-3xl bg-night-900 p-6 text-white">
            <Sparkles className="h-6 w-6 text-gold-300" />
            <p className="mt-3 font-display text-2xl font-semibold">Are you an astrologer?</p>
            <p className="mt-1 text-sm text-white/65">Join our panel, set your own per-minute price and consult seekers from anywhere.</p>
            <Link href="/astro-registration" className="btn-gold mt-5">Join as Astrologer <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </div>
        <Faq items={faqs} />
      </section>
    </>
  );
}
