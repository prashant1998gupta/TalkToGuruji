import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CheckCircle2, Flame, Video } from 'lucide-react';
import { db } from '@/lib/db';
import { EmptyState, PageHero } from '@/components/ui/primitives';
import { cx, inr } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Online Puja Booking',
  description: 'Book online pujas performed by experienced Vedic priests — Mangal Dosh Nivaran, Navgraha Shanti, Rudrabhishek and more, with live video.',
};

type SP = Promise<Record<string, string | undefined>>;

export default async function PujaList({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const tier = sp.tier === 'vip' || sp.tier === 'standard' ? sp.tier : '';
  const sort = sp.sort || 'popular';
  const pujas = await db.puja.findMany({
    where: { active: true, ...(tier ? { tier } : {}) },
    orderBy: sort === 'low' ? { price: 'asc' } : sort === 'high' ? { price: 'desc' } : [{ tier: 'desc' }, { createdAt: 'desc' }],
  });
  const link = (p: Record<string, string>) => {
    const u = new URLSearchParams({ ...(tier ? { tier } : {}), ...(sort !== 'popular' ? { sort } : {}), ...p });
    [...u.entries()].forEach(([k, v]) => !v && u.delete(k));
    const s = u.toString();
    return `/astrology-services/online-pooja-booking${s ? `?${s}` : ''}`;
  };
  const chip = (active: boolean) => cx('rounded-full px-4 py-2 text-sm font-semibold ring-1 transition', active ? 'bg-night-900 text-white ring-night-900' : 'bg-white text-ink/75 ring-line hover:ring-saffron-300');

  return (
    <>
      <PageHero
        eyebrow="Online Puja"
        title="Pujas performed in your name"
        intro="Your name and gotra in the sankalp, a live video link on the day, and energized prasad delivered to your home — performed by highly experienced Vedic priests following every traditional custom."
        crumbs={[{ label: 'Astrology Services', href: '/astrology-services' }, { label: 'Online Puja Booking' }]}
      >
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
          {['Vedic pandits', 'Live video of your puja', 'Prasad delivered home'].map((t) => <span key={t} className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-gold-300" />{t}</span>)}
        </div>
      </PageHero>

      <section className="container-x py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Link href={link({ tier: '' })} className={chip(!tier)}>All pujas</Link>
            <Link href={link({ tier: 'vip' })} className={chip(tier === 'vip')}>VIP</Link>
            <Link href={link({ tier: 'standard' })} className={chip(tier === 'standard')}>Standard</Link>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted">Sort:</span>
            {[['popular', 'Popular'], ['low', 'Price ↑'], ['high', 'Price ↓']].map(([v, l]) => (
              <Link key={v} href={link({ sort: v === 'popular' ? '' : v })} className={cx('rounded-full px-3 py-1.5 font-semibold', sort === v ? 'bg-saffron-50 text-saffron-700' : 'text-ink/70 hover:text-ink')}>{l}</Link>
            ))}
          </div>
        </div>

        {pujas.length === 0 ? <EmptyState title="No pujas found" /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pujas.map((p, i) => {
              const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
              return (
                <Link key={p.id} href={`/puja/${p.slug}`} className="card-hover group flex flex-col overflow-hidden">
                  <div className="relative aspect-[4/3] overflow-hidden bg-cream-200">
                    {p.image ? <Image src={p.image} alt={p.name} fill priority={i < 3} sizes="(max-width:640px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105" /> : <div className="night grid h-full place-items-center"><Flame className="h-10 w-10 text-gold-300" /></div>}
                    {p.tier === 'vip' && <span className="absolute left-3 top-3 rounded-full bg-night-900/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-300">VIP Puja</span>}
                    {off > 0 && <span className="absolute right-3 top-3 rounded-full bg-leaf px-2.5 py-1 text-[10px] font-bold text-white">{off}% OFF</span>}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="font-display text-xl font-semibold leading-snug text-night-900 group-hover:text-saffron-700">{p.name}</h2>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-muted">{p.excerpt}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                      <p><b className="text-lg text-night-900">{inr(p.price)}</b>{off > 0 && <span className="ml-1.5 text-sm text-muted line-through">{inr(p.mrp)}</span>}</p>
                      <span className="flex items-center gap-1 text-xs font-bold text-saffron-600"><Video className="h-3.5 w-3.5" /> Book now</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
