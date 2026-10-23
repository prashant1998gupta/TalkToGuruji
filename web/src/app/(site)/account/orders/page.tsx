import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CalendarDays, CheckCircle2, Flame, Gem, MapPin, MonitorPlay, Package, Video } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Badge, EmptyState } from '@/components/ui/primitives';
import { cx, fmtDate, inr, json, rupees } from '@/lib/format';

export const metadata: Metadata = { title: 'Orders & bookings', robots: { index: false } };

type SP = Promise<Record<string, string | undefined>>;
type Snapshot = { items: { slug: string; name: string; image: string | null; variant: string; price: number; qty: number }[]; subtotal: number; shipping: number; total: number };

const ORDER_TONE: Record<string, 'neutral' | 'green' | 'saffron' | 'red' | 'night'> = { PENDING_PAYMENT: 'saffron', PLACED: 'night', SHIPPED: 'saffron', DELIVERED: 'green', CANCELLED: 'red' };
const BOOK_TONE: Record<string, 'neutral' | 'green' | 'saffron' | 'red' | 'night'> = { PENDING_PAYMENT: 'saffron', CONFIRMED: 'night', COMPLETED: 'green', CANCELLED: 'red' };
const label = (s: string) => s.replace(/_/g, ' ').toLowerCase();

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const u = await requireUser(undefined, '/account/orders');
  const sp = await searchParams;
  const tab = sp.tab === 'puja' || (sp.booking && sp.tab !== 'mart') ? 'puja' : 'mart';
  const [orders, bookings] = await Promise.all([
    db.order.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } }),
    db.pujaBooking.findMany({ where: { userId: u.id }, include: { puja: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  const justPaid = (sp.order && orders.find((o) => o.id === sp.order && o.status !== 'PENDING_PAYMENT')) || (sp.booking && bookings.find((b) => b.id === sp.booking && b.status === 'CONFIRMED'));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-night-900">Orders & bookings</h1>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-line">
          {([['mart', `Astro Mart (${orders.length})`], ['puja', `Puja bookings (${bookings.length})`]] as const).map(([k, l]) => (
            <Link key={k} href={`/account/orders?tab=${k}`} className={cx('rounded-full px-4 py-2 text-sm font-semibold transition', tab === k ? 'bg-night-900 text-white' : 'text-ink/70 hover:text-ink')}>{l}</Link>
          ))}
        </div>
      </div>

      {justPaid && (
        <div className="flex items-center gap-3 rounded-2xl bg-leaf/10 p-4 text-sm font-semibold text-leaf ring-1 ring-leaf/20">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {sp.booking ? 'Your puja is booked! We’ll share the live video link before the puja.' : 'Thank you! Your order has been placed and will be dispatched soon.'}
        </div>
      )}

      {tab === 'mart' ? (
        orders.length === 0 ? (
          <EmptyState title="No orders yet" text="Energized gemstones, rudraksha and yantras await." action={<Link href="/astro-mart" className="btn-primary">Shop Astro Mart</Link>} />
        ) : (
          <div className="space-y-4">
            {orders.map((o) => {
              const s = json<Snapshot>(o.items, { items: [], subtotal: 0, shipping: 0, total: 0 });
              const addr = json<{ name?: string; city?: string; state?: string; pincode?: string }>(o.address, {});
              return (
                <article key={o.id} className={cx('card overflow-hidden', o.id === sp.order && 'ring-2 ring-saffron-400')}>
                  <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-cream-50 px-5 py-3 text-sm">
                    <span className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-saffron-600" /> Order #{o.id.slice(-6).toUpperCase()}</span>
                    <span className="text-muted">{fmtDate(o.createdAt)}</span>
                    <Badge tone={ORDER_TONE[o.status] || 'neutral'}>{label(o.status)}</Badge>
                  </header>
                  <ul className="divide-y divide-line px-5">
                    {s.items.map((it, k) => (
                      <li key={k} className="flex items-center gap-3 py-3">
                        <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-200">{it.image ? <Image src={it.image} alt="" fill sizes="48px" className="object-cover" /> : <Gem className="m-auto mt-3 h-5 w-5 text-saffron-300" />}</span>
                        <Link href={`/astro-mart/product/${it.slug}`} className="min-w-0 flex-1 text-sm"><span className="block truncate font-semibold hover:text-saffron-700">{it.name}</span><span className="text-xs text-muted">{it.variant ? `${it.variant} · ` : ''}Qty {it.qty}</span></Link>
                        <span className="text-sm font-semibold">{inr(it.price * it.qty)}</span>
                      </li>
                    ))}
                  </ul>
                  <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-sm">
                    <span className="flex items-center gap-1.5 text-muted"><MapPin className="h-4 w-4" /> {[addr.name, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</span>
                    <span className="font-bold">Total {rupees(o.amount)}</span>
                  </footer>
                </article>
              );
            })}
          </div>
        )
      ) : bookings.length === 0 ? (
        <EmptyState title="No puja bookings yet" text="Book a puja performed in your name by Vedic pandits." action={<Link href="/astrology-services/online-pooja-booking" className="btn-primary"><Flame className="h-4 w-4" /> Book a puja</Link>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bookings.map((b) => (
            <article key={b.id} className={cx('card flex flex-col overflow-hidden', b.id === sp.booking && 'ring-2 ring-saffron-400')}>
              <div className="flex gap-4 p-4">
                <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-200">{b.puja.image && <Image src={b.puja.image} alt="" fill sizes="80px" className="object-cover" />}</span>
                <div className="min-w-0 flex-1">
                  <Link href={`/puja/${b.puja.slug}`} className="line-clamp-2 font-semibold leading-snug hover:text-saffron-700">{b.puja.name}</Link>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted"><CalendarDays className="h-3.5 w-3.5" /> {fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted">{b.mode === 'ONLINE' ? <MonitorPlay className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />} {b.mode === 'ONLINE' ? 'Online · live video' : 'At home'}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm">
                <Badge tone={BOOK_TONE[b.status] || 'neutral'}>{label(b.status)}</Badge>
                <span className="text-xs text-muted">For {b.devoteeName}{b.gotra ? ` · ${b.gotra} gotra` : ''}</span>
                <span className="font-bold">{rupees(b.amount)}</span>
              </div>
              {b.liveLink && b.status === 'CONFIRMED' && (
                <a href={b.liveLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-night-900 py-2.5 text-sm font-semibold text-gold-300 hover:bg-night-800"><Video className="h-4 w-4" /> Join live puja</a>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
