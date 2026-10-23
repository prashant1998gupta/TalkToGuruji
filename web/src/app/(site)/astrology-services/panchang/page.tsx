import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Moon, MoonStar, Sun, Sunrise, Sunset } from 'lucide-react';
import { PageHero } from '@/components/ui/primitives';
import { CityPicker } from '@/components/astro/CityPicker';
import { PlanetTable } from '@/components/astro/PlanetTable';
import { cityById, cityLabel, DEFAULT_CITY } from '@/lib/astro/cities';
import { planetPositions } from '@/lib/astro/engine';
import { computePanchang } from '@/lib/astro/panchang';
import { PANCHANG_COPY } from '@/lib/astro/seo-copy';
import { fmtDateTimeTz, fmtTime, todayIn, zonedToUtc } from '@/lib/astro/time';

export const metadata: Metadata = {
  title: 'Today’s Panchang – Tithi, Nakshatra, Rahu Kaal & Muhurat',
  description: 'Daily Panchang with tithi, nakshatra, yoga, karana, sunrise, sunset, Rahu Kaal, Abhijit muhurat and hora for any city.',
};

type SP = Promise<Record<string, string | string[] | undefined>>;

const shift = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export default async function PanchangPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const city = cityById(typeof sp.city === 'string' ? sp.city : undefined) ?? DEFAULT_CITY;
  const today = todayIn(city.tz);
  const date = typeof sp.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : today;
  const p = computePanchang(date, city.lat, city.lon, city.tz);
  const tz = city.tz;
  const t = (d: Date | null | undefined) => fmtTime(d, tz);
  const dt = (d: Date | null | undefined) => fmtDateTimeTz(d, tz);
  const prettyDate = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const positions = planetPositions(p.sunrise ?? zonedToUtc(date, '06:00', tz));
  const link = (d: string) => `/astrology-services/panchang?date=${d}&city=${city.id}`;

  return (
    <>
      <PageHero
        eyebrow="Daily Panchang"
        title={<>Navigate your day with <span className="italic text-gold-300">auspicious timings</span></>}
        intro={<>{prettyDate} · {cityLabel(city)}</>}
        crumbs={[{ label: 'Astrology Services', href: '/astrology-services' }, { label: 'Panchang' }]}
      >
        <form method="get" className="grid max-w-3xl gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
          <div>
            <label className="label !text-white/60" htmlFor="pdate">Select date</label>
            <input id="pdate" type="date" name="date" defaultValue={date} className="input !border-white/15 !bg-white/5 !text-white [color-scheme:dark]" />
          </div>
          <div>
            <label className="label !text-white/60">Select city</label>
            <CityPicker name="city" dark defaultValue={{ id: city.id, label: cityLabel(city), tz: city.tz }} />
          </div>
          <button className="btn-gold">Show Panchang</button>
        </form>
      </PageHero>

      <div className="container-x space-y-10 py-10">
        <div className="flex items-center justify-between">
          <Link href={link(shift(date, -1))} className="btn-ghost btn-sm"><ChevronLeft className="h-4 w-4" /> Previous day</Link>
          {date !== today && <Link href={link(today)} className="text-sm font-semibold text-saffron-600 hover:underline">Today</Link>}
          <Link href={link(shift(date, 1))} className="btn-ghost btn-sm">Next day <ChevronRight className="h-4 w-4" /></Link>
        </div>

        {/* Sun & moon */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            [Sunrise, 'Sunrise', t(p.sunrise)],
            [Sunset, 'Sunset', t(p.sunset)],
            [MoonStar, 'Moonrise', t(p.moonrise)],
            [Moon, 'Moonset', t(p.moonset)],
          ].map(([I, l, v]) => {
            const Icon = I as typeof Sun;
            return (
              <div key={l as string} className="card flex items-center gap-3 p-4">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-saffron-50 text-saffron-600"><Icon className="h-5 w-5" /></span>
                <span><span className="block text-xs text-muted">{l as string}</span><span className="font-display text-xl font-semibold text-night-900">{v as string}</span></span>
              </div>
            );
          })}
        </section>

        {/* Pancha anga */}
        <section>
          <h2 className="h-display mb-4 text-2xl text-night-900 sm:text-3xl">The five limbs (Pancha-anga)</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['Tithi', `${p.tithi.paksha} ${p.tithi.name}`, p.tithi.ends ? `till ${dt(p.tithi.ends)}` : '', p.tithi.next ? `then ${p.tithi.next}` : ''],
              ['Vara', p.vara, 'weekday at sunrise', ''],
              ['Nakshatra', `${p.nakshatra.name} (pada ${p.nakshatra.pada})`, p.nakshatra.ends ? `till ${dt(p.nakshatra.ends)}` : '', `Lord: ${p.nakshatra.lord}`],
              ['Yoga', p.yoga.name, p.yoga.ends ? `till ${dt(p.yoga.ends)}` : '', p.yoga.auspicious ? 'Auspicious' : 'Inauspicious'],
              ['Karana', p.karana.name, p.karana.ends ? `till ${dt(p.karana.ends)}` : '', p.karana.name === 'Vishti' ? 'Bhadra — avoid new work' : ''],
            ].map(([k, v, a, b]) => (
              <div key={k} className="card p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-saffron-600">{k}</p>
                <p className="mt-1.5 font-display text-lg font-semibold leading-snug text-night-900">{v}</p>
                {a && <p className="mt-1 text-xs text-muted">{a}</p>}
                {b && <p className="text-xs text-muted">{b}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* Muhurat */}
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="card overflow-hidden">
            <h3 className="bg-rose/10 px-5 py-3 font-semibold text-rose">Inauspicious timings (Ashubha muhurat)</h3>
            <dl className="divide-y divide-line">
              {[['Rahu Kaal', p.rahuKaal], ['Gulika Kaal', p.gulika], ['Yamaganda Kaal', p.yamaganda]].map(([n, r]) => {
                const range = r as typeof p.rahuKaal;
                return (
                  <div key={n as string} className="flex justify-between px-5 py-3 text-sm">
                    <dt className="font-medium">{n as string}</dt><dd className="tabular-nums">{range ? `${t(range.start)} – ${t(range.end)}` : '—'}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
          <div className="card overflow-hidden">
            <h3 className="bg-leaf/10 px-5 py-3 font-semibold text-leaf">Auspicious timings (Shubha muhurat)</h3>
            <dl className="divide-y divide-line">
              <div className="flex justify-between px-5 py-3 text-sm"><dt className="font-medium">Abhijit Muhurta</dt><dd className="tabular-nums">{p.abhijit ? `${t(p.abhijit.start)} – ${t(p.abhijit.end)}` : 'Not observed on Wednesday'}</dd></div>
              <div className="flex justify-between px-5 py-3 text-sm"><dt className="font-medium">Brahma Muhurta</dt><dd className="tabular-nums">{p.brahmaMuhurta ? `${t(p.brahmaMuhurta.start)} – ${t(p.brahmaMuhurta.end)}` : '—'}</dd></div>
              <div className="flex justify-between px-5 py-3 text-sm"><dt className="font-medium">Day length</dt><dd className="tabular-nums">{Math.floor(p.dayLengthMin / 60)}h {p.dayLengthMin % 60}m</dd></div>
            </dl>
          </div>
        </section>

        {/* Calendar details */}
        <section className="card grid gap-x-8 gap-y-1 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Hindu month (Amanta)', p.masa], ['Paksha', p.tithi.paksha], ['Ritu', p.ritu], ['Vikram Samvat', String(p.vikramSamvat)],
            ['Shaka Samvat', String(p.shakaSamvat)], ['Moon sign', p.moonSign], ['Sun sign', p.sunSign], ['Ayanamsa (Lahiri)', `${p.ayanamsa.toFixed(3)}°`],
          ].map(([a, b]) => (
            <div key={a} className="flex justify-between gap-3 border-b border-line py-2.5 text-sm last:border-0 sm:border-b">
              <span className="text-muted">{a}</span><span className="font-semibold text-night-900">{b}</span>
            </div>
          ))}
        </section>

        {/* Hora */}
        {p.horas.length > 0 && (
          <section>
            <h2 className="h-display mb-1 text-2xl text-night-900 sm:text-3xl">Hora muhurta</h2>
            <p className="mb-4 text-sm text-muted">Planetary hours from sunrise (day) and sunset (night).</p>
            <div className="grid gap-5 lg:grid-cols-2">
              {[true, false].map((day) => (
                <div key={String(day)} className="card overflow-hidden">
                  <h3 className={`px-5 py-3 font-semibold ${day ? 'bg-gold-300/30 text-night-900' : 'bg-night-900 text-gold-300'}`}>{day ? 'Day hora' : 'Night hora'}</h3>
                  <ul className="grid grid-cols-2 divide-line text-sm sm:grid-cols-3">
                    {p.horas.filter((h) => h.day === day).map((h) => (
                      <li key={h.start.toISOString()} className="flex flex-col border-b border-r border-line px-4 py-2.5">
                        <span className="font-semibold text-night-900">{h.lord}</span>
                        <span className="text-xs tabular-nums text-muted">{t(h.start)} – {t(h.end)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="h-display mb-4 text-2xl text-night-900 sm:text-3xl">Planetary positions at sunrise</h2>
          <PlanetTable rows={positions} showHouse={false} />
        </section>

        <section className="max-w-3xl">
          <h2 className="h-display text-2xl text-night-900 sm:text-3xl">{PANCHANG_COPY.title}</h2>
          <div className="prose-guru mt-3">{PANCHANG_COPY.body.map((x, i) => <p key={i}>{x}</p>)}</div>
        </section>
      </div>
    </>
  );
}
