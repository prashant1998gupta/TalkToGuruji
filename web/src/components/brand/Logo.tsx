import Link from 'next/link';
import { cx } from '@/lib/format';

/** Brand mark: a sun-disc astrolabe with a crescent — drawn in SVG so it stays crisp at any size. */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="lg-sun" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d58a" />
          <stop offset="1" stopColor="#f5731a" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill="#120e24" />
      <circle cx="24" cy="24" r="17.5" fill="none" stroke="url(#lg-sun)" strokeWidth="1.2" strokeDasharray="1.5 2.6" />
      <circle cx="24" cy="24" r="13" fill="none" stroke="#f2c25b" strokeOpacity=".35" strokeWidth=".8" />
      <circle cx="24" cy="24" r="8" fill="url(#lg-sun)" />
      <path d="M27.8 19.2a6.2 6.2 0 1 0 0 9.6 5 5 0 1 1 0-9.6z" fill="#120e24" />
      <circle cx="35.6" cy="13.4" r="1.6" fill="#f6d58a" />
      <circle cx="12.4" cy="34.8" r="1" fill="#f6d58a" opacity=".8" />
    </svg>
  );
}

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <Link href="/" className={cx('group flex items-center gap-2.5', className)} aria-label="Talk to Guruji — home">
      <LogoMark className="h-9 w-9 transition-transform duration-500 group-hover:rotate-[30deg]" />
      <span className="leading-none">
        <span className={cx('block font-display text-[19px] font-semibold tracking-tight', dark ? 'text-white' : 'text-night-900')}>
          Talk to <span className="text-saffron-500">Guruji</span>
        </span>
        <span className={cx('mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.28em]', dark ? 'text-gold-300/80' : 'text-muted')}>
          Vedic Astrology
        </span>
      </span>
    </Link>
  );
}
