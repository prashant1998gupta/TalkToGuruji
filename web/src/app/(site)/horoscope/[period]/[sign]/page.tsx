import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Briefcase, Coins, Flame, Heart, HeartPulse, MessageCircle, Phone, Plane, Smile, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/primitives';
import { PeriodTabs, SignGrid } from '@/components/astro/SignGrid';
import { DAILY_FIELDS, isPeriod, latestDaily, latestPeriodic } from '@/lib/astro/horoscope';
import { signBySlug } from '@/lib/zodiac';

export const dynamic = 'force-dynamic';

const ICONS = { personal: User, profession: Briefcase, love: Heart, luck: Coins, health: HeartPulse, emotions: Smile, travel: Plane };
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export async function generateMetadata({ params }: { params: Promise<{ period: string; sign: string }> }): Promise<Metadata> {
  const { period, sign } = await params;
  const s = signBySlug(sign);
  if (!s || !isPeriod(period)) return {};
  return { title: `${s.name} ${cap(period)} Horoscope (${s.hindi} Rashifal)`, description: `${s.name} ${period} horoscope: love, career, money and health predictions for ${s.name} (${s.dates}).` };
}

export default async function SignHoroscope({ params }: { params: Promise<{ period: string; sign: string }> }) {
  const { period, sign } = await params;
  const s = signBySlug(sign);
  if (!s || !isPeriod(period)) notFound();

  let daily: Awaited<ReturnType<typeof latestDaily>> | null = null;
  let periodic: Awaited<ReturnType<typeof latestPeriodic>>[string] | undefined;
  if (period === 'daily') daily = await latestDaily();
  else periodic = (await latestPeriodic(period))[s.slug];
  const d = daily?.bySign[s.slug];
  const dateLabel = daily?.date ? new Date(`${daily.date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : periodic?.label;
  const has = period === 'daily' ? !!d && DAILY_FIELDS.some((f) => d[f.key]) : !!periodic?.body;

  return (
    <>
      <section className="night relative overflow-hidden">
        <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 select-none font-['Segoe_UI_Symbol','Noto_Sans_Symbols_2',serif] text-[260px] leading-none text-gold-300/10 sm:text-[360px]" aria-hidden="true">{s.glyph}</div>
        <div className="container-x relative py-10 sm:py-14">
          <Breadcrumbs items={[{ label: 'Horoscope', href: '/horoscope' }, { label: `${cap(period)}`, href: `/horoscope/${period}` }, { label: s.name }]} dark />
          <div className="mt-6 flex flex-wrap items-center gap-5">
            <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-gold-300/25 to-saffron-500/15 font-['Segoe_UI_Symbol','Noto_Sans_Symbols_2',serif] text-5xl text-gold-300 ring-1 ring-gold-400/40">{s.glyph}</span>
            <div>
              <p className="eyebrow !text-gold-300">{cap(period)} horoscope</p>
              <h1 className="h-display mt-1 text-4xl text-white sm:text-5xl">{s.name} <span className="text-2xl text-white/50 sm:text-3xl">· {s.hindi}</span></h1>
              {dateLabel && <p className="mt-1 text-sm text-white/60">{dateLabel}</p>}
            </div>
          </div>
          <dl className="mt-6 flex flex-wrap gap-2 text-xs">
            {[['Dates', s.dates], ['Element', s.element], ['Ruling planet', s.lord]].map(([k, v]) => (
              <div key={k} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-white/80"><dt className="inline text-white/45">{k}: </dt><dd className="inline font-semibold">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-6"><PeriodTabs period={period} sign={s.slug} /></div>
        </div>
      </section>

      <div className="container-x grid gap-10 py-10 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {!has ? (
            <div className="card p-8 text-center">
              <Flame className="mx-auto h-10 w-10 text-saffron-500" />
              <p className="mt-3 font-display text-xl font-semibold text-night-900">The {period} reading for {s.name} is being prepared</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">Our astrologers haven’t published this one yet. Meanwhile, get a personal prediction from a Guruji — it’s based on your full birth chart, not just your sign.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Link href="/astrology-services/chat-with-astrologer" className="btn-primary"><MessageCircle className="h-4 w-4" /> Chat with astrologer</Link>
                <Link href={`/horoscope/daily/${s.slug}`} className="btn-ghost">Read today’s horoscope</Link>
              </div>
            </div>
          ) : period === 'daily' && d ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {DAILY_FIELDS.filter((f) => d[f.key]).map((f, i) => {
                const I = ICONS[f.key];
                return (
                  <article key={f.key} className={`card p-5 ${i === 0 && DAILY_FIELDS.filter((x) => d[x.key]).length % 2 ? 'sm:col-span-2' : ''}`}>
                    <h2 className="flex items-center gap-2.5 font-semibold text-night-900">
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-saffron-50 text-saffron-600"><I className="h-4.5 w-4.5" /></span>{f.label}
                    </h2>
                    <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{d[f.key]}</p>
                  </article>
                );
              })}
            </div>
          ) : (
            <article className="card p-6 sm:p-8">
              {periodic?.label && <p className="eyebrow">{periodic.label}</p>}
              <div className="prose-guru" dangerouslySetInnerHTML={{ __html: periodic!.body }} />
            </article>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="night rounded-3xl p-6">
            <p className="font-display text-xl font-semibold text-white">Want a reading made just for you?</p>
            <p className="mt-1 text-sm text-white/65">Sun-sign horoscopes are general. A Guruji reads your exact kundli.</p>
            <div className="mt-4 grid gap-2">
              <Link href="/astrology-services/chat-with-astrologer" className="btn-gold"><MessageCircle className="h-4 w-4" /> Chat with astrologer</Link>
              <Link href="/astrology-services/talk-to-astrologer" className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10"><Phone className="h-4 w-4" /> Talk on call</Link>
            </div>
          </div>
          <Link href="/astrology-services/free-kundli" className="card-hover block p-5">
            <p className="font-semibold text-night-900">Free Kundli</p>
            <p className="text-sm text-muted">Get your birth chart, dashas and doshas in seconds →</p>
          </Link>
        </aside>
      </div>

      <section className="container-x pb-6">
        <h2 className="h-display mb-5 text-2xl text-night-900">Other signs</h2>
        <SignGrid period={period} active={s.slug} />
      </section>
    </>
  );
}
