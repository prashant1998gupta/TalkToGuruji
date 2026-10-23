import Link from 'next/link';
import { ArrowRight, CalendarDays, Sunrise, Sunset } from 'lucide-react';
import { DEFAULT_CITY } from '@/lib/astro/cities';
import { computePanchang } from '@/lib/astro/panchang';
import { fmtTime, todayIn } from '@/lib/astro/time';

/** Compact "Today's Panchang" card for New Delhi (server component). */
export function TodayPanchangCard({ className = '' }: { className?: string }) {
  const c = DEFAULT_CITY;
  const date = todayIn(c.tz);
  const p = computePanchang(date, c.lat, c.lon, c.tz);
  const t = (d: Date | null | undefined) => fmtTime(d, c.tz);
  const nice = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="night flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-gold-300"><CalendarDays className="h-3.5 w-3.5" /> Today’s Panchang</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-white">{nice}</p>
        </div>
        <div className="text-right text-xs text-white/70">
          <p className="flex items-center justify-end gap-1"><Sunrise className="h-3.5 w-3.5 text-gold-300" />{t(p.sunrise)}</p>
          <p className="flex items-center justify-end gap-1"><Sunset className="h-3.5 w-3.5 text-saffron-300" />{t(p.sunset)}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-line text-sm">
        {[
          ['Tithi', `${p.tithi.paksha} ${p.tithi.name}`],
          ['Nakshatra', p.nakshatra.name],
          ['Yoga', p.yoga.name],
          ['Karana', p.karana.name],
          ['Rahu Kaal', p.rahuKaal ? `${t(p.rahuKaal.start)} – ${t(p.rahuKaal.end)}` : '—'],
          ['Abhijit', p.abhijit ? `${t(p.abhijit.start)} – ${t(p.abhijit.end)}` : 'Not today'],
        ].map(([k, v]) => (
          <div key={k} className="bg-white px-4 py-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{k}</dt>
            <dd className="mt-0.5 font-semibold text-night-900">{v}</dd>
          </div>
        ))}
      </dl>
      <Link href="/astrology-services/panchang" className="flex items-center justify-between bg-cream-100 px-5 py-3 text-sm font-semibold text-saffron-700 hover:bg-saffron-50">
        Full Panchang · {p.masa} {p.tithi.paksha} paksha <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
