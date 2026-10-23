import Link from 'next/link';
import { SIGNS } from '@/lib/zodiac';

/** 12 zodiac tiles (light surface). `excerpts` adds a short preview under each sign. */
export function SignGrid({ period, excerpts = {}, active }: { period: string; excerpts?: Record<string, string>; active?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {SIGNS.map((s) => (
        <Link
          key={s.slug}
          href={`/horoscope/${period}/${s.slug}`}
          aria-current={active === s.slug ? 'page' : undefined}
          className={`card-hover group flex flex-col p-4 ${active === s.slug ? 'ring-2 ring-saffron-400' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-night-900 font-['Segoe_UI_Symbol','Noto_Sans_Symbols_2',serif] text-2xl text-gold-300 transition group-hover:scale-110">{s.glyph}</span>
            <span>
              <span className="block font-display text-lg font-semibold leading-tight text-night-900">{s.name}</span>
              <span className="text-[11px] text-muted">{s.hindi} · {s.dates}</span>
            </span>
          </div>
          {excerpts[s.slug] && <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-ink/70">{excerpts[s.slug]}</p>}
        </Link>
      ))}
    </div>
  );
}

export function PeriodTabs({ period, sign }: { period: string; sign?: string }) {
  return (
    <nav className="no-scrollbar flex gap-2 overflow-x-auto" aria-label="Horoscope period">
      {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
        <Link
          key={p}
          href={sign ? `/horoscope/${p}/${sign}` : `/horoscope/${p}`}
          aria-current={p === period ? 'page' : undefined}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${p === period ? 'bg-gold-400 text-night-900' : 'border border-white/15 text-white/80 hover:border-gold-400 hover:text-gold-300'}`}
        >
          {p}
        </Link>
      ))}
    </nav>
  );
}
