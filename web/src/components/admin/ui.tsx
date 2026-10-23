import Link from 'next/link';
import { Search } from 'lucide-react';
import { cx } from '@/lib/format';
import { Pagination } from '@/components/ui/primitives';

export function PageHeader({ title, sub, actions }: { title: string; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h-display text-2xl text-night-900 sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, href, tone = 'default' }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string; tone?: 'default' | 'alert' | 'good' }) {
  const inner = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className={cx('mt-1.5 font-display text-2xl font-semibold tabular-nums', tone === 'alert' ? 'text-saffron-600' : tone === 'good' ? 'text-leaf' : 'text-night-900')}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </>
  );
  return href ? <Link href={href} className="card-hover block p-4">{inner}</Link> : <div className="card p-4">{inner}</div>;
}

/** Table shell with sticky header and horizontal scroll on small screens. */
export function Table({ head, children, empty }: { head: React.ReactNode[]; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="card overflow-hidden">
      <div className="max-h-[70vh] overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-cream-100/95 backdrop-blur">
            <tr>
              {head.map((h, i) => (
                <th key={i} className="whitespace-nowrap border-b border-line px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70 [&_td]:px-4 [&_td]:py-2.5 [&_td]:align-middle [&_tr:hover]:bg-cream-50">{children}</tbody>
        </table>
        {empty && <p className="px-4 py-12 text-center text-sm text-muted">Nothing here yet.</p>}
      </div>
    </div>
  );
}

/** Plain GET form so filters live in the URL and work without JS. */
export function FilterBar({ children, q, placeholder = 'Search…', hidden = {} }: { children?: React.ReactNode; q?: string; placeholder?: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-center gap-2">
      {Object.entries(hidden).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
      <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} placeholder={placeholder} className="input !pl-9" aria-label="Search" />
      </label>
      {children}
      <button className="btn-dark btn-sm !py-2.5">Apply</button>
    </form>
  );
}

export function Select({ name, value, options, label }: { name: string; value?: string; options: [string, string][]; label: string }) {
  return (
    <select name={name} defaultValue={value || ''} className="input !w-auto" aria-label={label}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

export function Tabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
  return (
    <div className="no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-line">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cx('-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-semibold transition', t.key === active ? 'border-saffron-500 text-night-900' : 'border-transparent text-muted hover:text-ink')}
        >
          {t.label}
          {t.count != null && <span className={cx('rounded-full px-1.5 text-[11px]', t.key === active ? 'bg-saffron-100 text-saffron-700' : 'bg-cream-200')}>{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

const TONES: Record<string, string> = {
  APPROVED: 'bg-leaf/10 text-leaf', ACTIVE: 'bg-leaf/10 text-leaf', PAID: 'bg-leaf/10 text-leaf', CONFIRMED: 'bg-leaf/10 text-leaf', DELIVERED: 'bg-leaf/10 text-leaf', COMPLETED: 'bg-leaf/10 text-leaf', PLACED: 'bg-sky-100 text-sky-700', SHIPPED: 'bg-sky-100 text-sky-700', ENDED: 'bg-cream-200 text-ink/70',
  PENDING: 'bg-saffron-50 text-saffron-700', PENDING_PAYMENT: 'bg-saffron-50 text-saffron-700', REQUESTED: 'bg-saffron-50 text-saffron-700', CREATED: 'bg-saffron-50 text-saffron-700',
  REJECTED: 'bg-rose/10 text-rose', SUSPENDED: 'bg-rose/10 text-rose', CANCELLED: 'bg-rose/10 text-rose', FAILED: 'bg-rose/10 text-rose', MISSED: 'bg-rose/10 text-rose',
  ADMIN: 'bg-night-900 text-gold-300', ASTROLOGER: 'bg-saffron-50 text-saffron-700', USER: 'bg-cream-200 text-ink/70',
};
export function Pill({ v }: { v: string }) {
  return <span className={cx('inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide', TONES[v] || 'bg-cream-200 text-ink/70')}>{v.replace(/_/g, ' ')}</span>;
}

/** Builds a URL that keeps the current filters and changes one or more params. */
export function qs(base: string, params: Record<string, string | number | undefined | null>) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') u.set(k, String(v));
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

export function Pager({ page, total, per, base, params }: { page: number; total: number; per: number; base: string; params: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / per));
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="mt-10 text-xs text-muted">{total.toLocaleString('en-IN')} total</p>
      <Pagination page={page} pages={pages} href={(p) => qs(base, { ...params, page: p > 1 ? p : undefined })} />
    </div>
  );
}

export const pageParam = (v?: string) => Math.max(1, Number(v) || 1);

export function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-night-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function KV({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 break-words font-medium text-ink">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}
