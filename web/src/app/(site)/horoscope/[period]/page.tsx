import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageHero } from '@/components/ui/primitives';
import { PeriodTabs, SignGrid } from '@/components/astro/SignGrid';
import { firstSentence, isPeriod, latestDaily, latestPeriodic } from '@/lib/astro/horoscope';

export const dynamic = 'force-dynamic';

const TITLES: Record<string, string> = { daily: 'Daily Horoscope', weekly: 'Weekly Horoscope', monthly: 'Monthly Horoscope', yearly: 'Yearly Horoscope' };

export async function generateMetadata({ params }: { params: Promise<{ period: string }> }): Promise<Metadata> {
  const { period } = await params;
  if (!isPeriod(period)) return {};
  return { title: `${TITLES[period]} – Rashifal for All 12 Signs`, description: `Free ${period} horoscope for Aries to Pisces: love, career, health and luck predictions by Talk to Guruji astrologers.` };
}

export default async function PeriodPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!isPeriod(period)) notFound();

  let excerpts: Record<string, string> = {};
  let sub = '';
  if (period === 'daily') {
    const d = await latestDaily();
    excerpts = Object.fromEntries(Object.entries(d.bySign).map(([s, v]) => [s, firstSentence(v.profession || v.love || v.personal)]));
    if (d.date) sub = new Date(`${d.date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  } else {
    const m = await latestPeriodic(period);
    excerpts = Object.fromEntries(Object.entries(m).map(([s, v]) => [s, firstSentence(v.excerpt)]));
  }

  return (
    <>
      <PageHero
        eyebrow="Rashifal"
        title={TITLES[period]}
        intro={sub || `Select your zodiac sign to read your ${period} predictions.`}
        crumbs={[{ label: 'Horoscope', href: '/horoscope' }, { label: TITLES[period] }]}
      >
        <PeriodTabs period={period} />
      </PageHero>
      <div className="container-x py-10">
        <SignGrid period={period} excerpts={excerpts} />
      </div>
    </>
  );
}
