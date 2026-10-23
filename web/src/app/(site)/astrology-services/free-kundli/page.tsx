import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, MapPin, Orbit, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/ui/primitives';
import { BirthFields } from '@/components/astro/BirthFields';
import { KundliReport } from '@/components/astro/KundliReport';
import { DeleteKundliButton } from '@/components/astro/KundliActions';
import { birthFromParams, cityOption } from '@/lib/astro/input';
import { computeKundli } from '@/lib/astro/kundli';
import { KUNDLI_COPY } from '@/lib/astro/seo-copy';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Free Kundli Online – Janam Kundli with Dasha & Dosha',
  description: KUNDLI_COPY.intro,
};

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function FreeKundliPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const input = birthFromParams(sp);
  if (input) {
    const k = computeKundli(input);
    return <KundliReport k={k} saveInput={{ name: input.name, gender: input.gender, date: input.date, time: input.time, city: String(sp.city || input.cityId) }} />;
  }

  const user = await currentUser();
  const saved = user ? await db.kundli.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 12 }) : [];
  const defaults = {
    name: user?.name || '',
    gender: user?.gender || 'Male',
    date: user?.birthDate || '',
    time: user?.birthTime || '',
    city: cityOption(typeof sp.city === 'string' ? sp.city : undefined),
  };
  const attempted = Object.keys(sp).length > 0;

  return (
    <>
      <PageHero
        eyebrow="Free Janam Kundli"
        title={<>Generate your <span className="italic text-gold-300">Free Kundli</span> online</>}
        intro={KUNDLI_COPY.intro}
        crumbs={[{ label: 'Astrology Services', href: '/astrology-services' }, { label: 'Free Kundli' }]}
      />

      <div className="container-x relative z-10 -mt-6 grid gap-8 pb-6 lg:grid-cols-[1.25fr_1fr]">
        <form method="get" action="/astrology-services/free-kundli" className="card p-5 sm:p-8">
          <h2 className="font-display text-2xl font-semibold text-night-900">New kundli</h2>
          <p className="mb-6 mt-1 text-sm text-muted">Enter exact birth details — even a few minutes change the lagna.</p>
          {attempted && <p className="mb-4 rounded-xl bg-rose/10 px-3 py-2 text-sm text-rose">Please fill all fields and pick the birth place from the list.</p>}
          <BirthFields defaults={defaults} />
          <button className="btn-primary btn-lg mt-6 w-full sm:w-auto">Get your kundli <ArrowRight className="h-4 w-4" /></button>
        </form>

        <aside className="space-y-4">
          <div className="card p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-night-900">Saved kundli</h2>
            {!user ? (
              <p className="mt-2 text-sm text-muted">
                <Link href="/login?next=/astrology-services/free-kundli" className="font-semibold text-saffron-600 hover:underline">Log in</Link> to save kundlis for yourself and your family and open them any time.
              </p>
            ) : saved.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No saved kundlis yet. Generate one and tap “Save kundli”.</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {saved.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2.5">
                    <Link href={`/kundli/${s.id}`} className="group flex min-w-0 flex-1 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-night-900 font-display text-gold-300">{s.name[0]?.toUpperCase()}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-night-900 group-hover:text-saffron-700">{s.name}</span>
                        <span className="block truncate text-xs text-muted">{s.birthDate} · {s.birthTime} · {s.place}</span>
                      </span>
                    </Link>
                    <DeleteKundliButton id={s.id} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-3xl bg-gradient-to-br from-saffron-50 to-gold-300/30 p-5 ring-1 ring-saffron-100 sm:p-6">
            <p className="font-semibold text-night-900">What you’ll get</p>
            <ul className="mt-3 space-y-2 text-sm text-ink/75">
              {[
                [Orbit, 'Lagna & Navamsa charts (North Indian style)'],
                [Sparkles, 'Planet positions, nakshatras and avakhada'],
                [CalendarDays, 'Vimshottari dasha timeline'],
                [Clock, 'Manglik, Kaal Sarp & Sade Sati check'],
                [MapPin, 'Gemstone suggestions by lagna'],
              ].map(([I, t]) => {
                const Icon = I as typeof Orbit;
                return <li key={t as string} className="flex items-center gap-2.5"><Icon className="h-4 w-4 text-saffron-600" />{t as string}</li>;
              })}
            </ul>
          </div>
        </aside>
      </div>

      <section className="container-x py-12">
        <div className="max-w-3xl">
          <h2 className="h-display text-2xl text-night-900 sm:text-3xl">{KUNDLI_COPY.title}</h2>
          <div className="prose-guru mt-3">{KUNDLI_COPY.body.map((p, i) => <p key={i}>{p}</p>)}</div>
        </div>
      </section>
    </>
  );
}
