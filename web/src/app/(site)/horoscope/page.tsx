import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarRange, Calendar, Star, Sunrise } from 'lucide-react';
import { PageHero } from '@/components/ui/primitives';
import { PeriodTabs, SignGrid } from '@/components/astro/SignGrid';
import { firstSentence, latestDaily } from '@/lib/astro/horoscope';

export const metadata: Metadata = {
  title: 'Horoscope – Daily, Weekly, Monthly & Yearly Rashifal',
  description: 'Free daily, weekly, monthly and yearly horoscope for all 12 zodiac signs — love, career, health and luck predictions by Talk to Guruji.',
};
export const dynamic = 'force-dynamic';

export default async function HoroscopeHub() {
  const daily = await latestDaily();
  const excerpts = Object.fromEntries(Object.entries(daily.bySign).map(([s, d]) => [s, firstSentence(d.profession || d.love || d.personal)]));
  return (
    <>
      <PageHero
        eyebrow="Rashifal"
        title={<>Your horoscope, <span className="italic text-gold-300">written in the stars</span></>}
        intro="Choose your zodiac sign for daily, weekly, monthly and yearly predictions on love, career, health and luck."
        crumbs={[{ label: 'Horoscope' }]}
      >
        <PeriodTabs period="" />
      </PageHero>
      <div className="container-x space-y-10 py-10">
        <section>
          <h2 className="h-display mb-1 text-2xl text-night-900 sm:text-3xl">Today’s horoscope</h2>
          <p className="mb-5 text-sm text-muted">Tap your sign for the full reading.</p>
          <SignGrid period="daily" excerpts={excerpts} />
        </section>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['daily', 'Daily horoscope', 'What today holds for you', Sunrise],
            ['weekly', 'Weekly horoscope', 'Plan the week ahead', CalendarRange],
            ['monthly', 'Monthly horoscope', 'Themes for the month', Calendar],
            ['yearly', 'Yearly horoscope', 'Your year at a glance', Star],
          ].map(([p, t, d, I]) => {
            const Icon = I as typeof Star;
            return (
              <Link key={p as string} href={`/horoscope/${p}`} className="card-hover flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-night-900 text-gold-300"><Icon className="h-5 w-5" /></span>
                <span><span className="block font-semibold text-night-900">{t as string}</span><span className="text-xs text-muted">{d as string}</span></span>
              </Link>
            );
          })}
        </section>
      </div>
    </>
  );
}
