import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MessageCircle, RotateCcw } from 'lucide-react';
import { PageHero } from '@/components/ui/primitives';
import { GRAHA_HI, RASHIS_HI } from '@/lib/astro/constants';
import { fmtDeg } from '@/lib/astro/engine';
import { currentTransits, upcomingIngresses } from '@/lib/astro/transits';

export const metadata: Metadata = {
  title: 'Planetary Transits – Live Graha Positions & Gochar 2026',
  description: 'Discover how planetary transits influence your life: live sidereal positions of all nine grahas and upcoming sign changes for the next 12 months.',
};

export const revalidate = 3600;

const TZ = 'Asia/Kolkata';
const COLORS: Record<string, string> = {
  Sun: 'from-gold-400 to-saffron-500', Moon: 'from-slate-200 to-slate-400', Mars: 'from-saffron-500 to-rose', Mercury: 'from-leaf to-emerald-700',
  Jupiter: 'from-gold-300 to-gold-500', Venus: 'from-pink-200 to-rose', Saturn: 'from-night-600 to-night-900', Rahu: 'from-slate-500 to-night-800', Ketu: 'from-amber-700 to-night-800',
};

export default function TransitsPage() {
  const now = new Date();
  const planets = currentTransits(now);
  const ingresses = upcomingIngresses(365, now);
  const byMonth = new Map<string, typeof ingresses>();
  for (const i of ingresses) {
    const k = i.date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: TZ });
    byMonth.set(k, [...(byMonth.get(k) || []), i]);
  }

  return (
    <>
      <PageHero
        eyebrow="Gochar"
        title={<>Planetary transits: navigating the shifts in <span className="italic text-gold-300">cosmic energy</span></>}
        intro="Discover how planetary transits influence your life and shape your experiences. Live sidereal (Lahiri) positions, updated hourly."
        crumbs={[{ label: 'Planetary Transits' }]}
      />

      <div className="container-x space-y-12 py-10">
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <h2 className="h-display text-2xl text-night-900 sm:text-3xl">Where the grahas are now</h2>
            <p className="text-xs text-muted">As of {now.toLocaleString('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })} IST</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planets.map((p) => (
              <article key={p.graha} className="card-hover flex items-center gap-4 p-4">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-soft ${COLORS[p.graha]}`}>{p.graha.slice(0, 2)}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-night-900">
                    {p.graha} <span className="text-xs font-normal text-muted">{GRAHA_HI[p.graha]}</span>
                    {p.retro && p.graha !== 'Rahu' && p.graha !== 'Ketu' && <span className="flex items-center gap-0.5 rounded-full bg-rose/10 px-1.5 py-0.5 text-[10px] font-bold text-rose"><RotateCcw className="h-3 w-3" /> R</span>}
                  </p>
                  <p className="text-sm text-ink/80">{p.signName} <span className="text-muted">({RASHIS_HI[p.sign]})</span> · <span className="font-mono text-xs">{fmtDeg(p.degInSign)}</span></p>
                  <p className="text-xs text-muted">{p.nakshatraName} pada {p.pada}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="h-display mb-1 text-2xl text-night-900 sm:text-3xl">Upcoming sign changes</h2>
          <p className="mb-6 text-sm text-muted">Computed ingress times for the next 12 months (IST). The Moon changes sign every ~2½ days and is not listed.</p>
          <div className="space-y-6">
            {[...byMonth.entries()].map(([month, items]) => (
              <div key={month} className="grid gap-3 md:grid-cols-[180px_1fr]">
                <h3 className="font-display text-lg font-semibold text-saffron-700 md:pt-3">{month}</h3>
                <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                  {items.map((i) => (
                    <li key={i.graha + i.date.toISOString()} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm">
                      <span className={`grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white ${COLORS[i.graha]}`}>{i.graha.slice(0, 2)}</span>
                      <span className="min-w-[90px] font-semibold text-night-900">{i.graha}</span>
                      <span className="flex items-center gap-1.5 text-ink/80">{i.from} <ArrowRight className="h-3.5 w-3.5 text-muted" /> <b className="text-night-900">{i.to}</b></span>
                      {i.retro && <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose">Retrograde</span>}
                      <span className="ml-auto text-xs tabular-nums text-muted">{i.date.toLocaleString('en-IN', { timeZone: TZ, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="night flex flex-wrap items-center justify-between gap-6 rounded-[2rem] p-8">
          <div>
            <h2 className="h-display text-2xl text-white sm:text-3xl">How will this transit affect you?</h2>
            <p className="mt-1 text-white/65">Transits act on your natal chart. Generate your kundli or ask a Guruji for a personal gochar reading.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/astrology-services/free-kundli" className="btn-gold btn-lg">Free Kundli</Link>
            <Link href="/astrology-services/chat-with-astrologer" className="btn btn-lg border border-white/20 bg-white/5 text-white hover:bg-white/10"><MessageCircle className="h-5 w-5" /> Ask an astrologer</Link>
          </div>
        </section>
      </div>
    </>
  );
}
