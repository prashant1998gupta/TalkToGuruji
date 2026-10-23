import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronRight as Sep, Star } from 'lucide-react';
import { cx } from '@/lib/format';

/** Initials avatar with a deterministic gradient (we have no photos for astrologers yet). */
const GRADS = ['from-saffron-400 to-rose', 'from-night-600 to-night-900', 'from-gold-400 to-saffron-600', 'from-leaf to-night-700', 'from-rose to-night-600', 'from-cyan-600 to-night-800'];
export function Avatar({ name, src, size = 56, online, className }: { name: string; src?: string | null; size?: number; online?: boolean | null; className?: string }) {
  const clean = name.replace(/^(Acharya|Pt\.|Dr\.|Guru|Astro|Tarot|Sadhvi|Jyotishi|Numerologist)\s+/i, '');
  const initials = clean.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const g = GRADS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADS.length];
  return (
    <span className={cx('relative inline-block shrink-0', className)} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover ring-2 ring-white" loading="lazy" />
      ) : (
        <span className={cx('grid h-full w-full place-items-center rounded-full bg-gradient-to-br font-display font-semibold text-white ring-2 ring-white', g)} style={{ fontSize: size * 0.36 }}>
          {initials}
        </span>
      )}
      {online != null && (
        <span className={cx('absolute bottom-0.5 right-0.5 rounded-full ring-2 ring-white', online ? 'animate-pulse-ring bg-leaf' : 'bg-muted/50')} style={{ width: size * 0.22, height: size * 0.22 }} />
      )}
    </span>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-gold-400 text-gold-400' : 'fill-cream-300 text-cream-300'} />
      ))}
    </span>
  );
}

export type Crumb = { label: string; href?: string };
export function Breadcrumbs({ items, dark }: { items: Crumb[]; dark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb" className={cx('flex flex-wrap items-center gap-1 text-xs font-medium', dark ? 'text-white/55' : 'text-muted')}>
      <Link href="/" className={dark ? 'hover:text-white' : 'hover:text-ink'}>Home</Link>
      {items.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          <Sep className="h-3 w-3 opacity-60" />
          {c.href ? <Link href={c.href} className={dark ? 'hover:text-white' : 'hover:text-ink'}>{c.label}</Link> : <span className={dark ? 'text-white/85' : 'text-ink/80'}>{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

/** Dark celestial page header used across inner pages. */
export function PageHero({ eyebrow, title, intro, crumbs, children, compact }: { eyebrow?: string; title: React.ReactNode; intro?: React.ReactNode; crumbs?: Crumb[]; children?: React.ReactNode; compact?: boolean }) {
  return (
    <section className="night relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
      <svg className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] animate-spin-slow opacity-25" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="96" fill="none" stroke="#f2c25b" strokeWidth=".5" />
        <circle cx="100" cy="100" r="78" fill="none" stroke="#f2c25b" strokeWidth=".4" strokeDasharray="1.5 3" />
        {Array.from({ length: 24 }).map((_, i) => (
          <line key={i} x1="100" y1="4" x2="100" y2={i % 2 ? 12 : 20} stroke="#f2c25b" strokeWidth=".5" transform={`rotate(${i * 15} 100 100)`} />
        ))}
      </svg>
      <div className={cx('container-x relative', compact ? 'py-10' : 'py-12 sm:py-16')}>
        {crumbs && <Breadcrumbs items={crumbs} dark />}
        {eyebrow && <p className="eyebrow mt-5 !text-gold-300">{eyebrow}</p>}
        <h1 className="h-display mt-2 max-w-3xl text-3xl leading-tight text-white sm:text-5xl">{title}</h1>
        {intro && <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/65">{intro}</div>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, action, intro, className }: { eyebrow?: string; title: React.ReactNode; action?: { label: string; href: string }; intro?: string; className?: string }) {
  return (
    <div className={cx('mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="h-display mt-1.5 text-3xl text-night-900 sm:text-4xl">{title}</h2>
        {intro && <p className="mt-2 text-[15px] text-muted">{intro}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn-ghost">
          {action.label} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function Pagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <Link aria-disabled={page <= 1} href={href(Math.max(1, page - 1))} className={cx('grid h-10 w-10 place-items-center rounded-full border border-line bg-white', page <= 1 && 'pointer-events-none opacity-40')} aria-label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </Link>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link href={href(n)} aria-current={n === page ? 'page' : undefined} className={cx('grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold', n === page ? 'bg-night-900 text-white' : 'border border-line bg-white hover:border-saffron-300')}>
            {n}
          </Link>
        </span>
      ))}
      <Link aria-disabled={page >= pages} href={href(Math.min(pages, page + 1))} className={cx('grid h-10 w-10 place-items-center rounded-full border border-line bg-white', page >= pages && 'pointer-events-none opacity-40')} aria-label="Next page">
        <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-gold-400" aria-hidden="true">
        <circle cx="32" cy="32" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
        <path d="M38 22a12 12 0 1 0 0 20 10 10 0 1 1 0-20z" fill="currentColor" opacity=".8" />
      </svg>
      <p className="mt-4 font-display text-xl font-semibold text-night-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'green' | 'saffron' | 'red' | 'night' }) {
  const t = { neutral: 'bg-cream-200 text-ink/75', green: 'bg-leaf/10 text-leaf', saffron: 'bg-saffron-50 text-saffron-700', red: 'bg-rose/10 text-rose', night: 'bg-night-900 text-gold-300' }[tone];
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide', t)}>{children}</span>;
}
