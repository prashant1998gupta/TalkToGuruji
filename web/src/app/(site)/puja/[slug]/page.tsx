import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CalendarCheck, Flame, Gift, ScrollText, ShieldCheck, Video } from 'lucide-react';
import { db } from '@/lib/db';
import { Breadcrumbs } from '@/components/ui/primitives';
import { PujaBookingForm } from '@/components/commerce/PujaBookingForm';
import { ShareButtons } from '@/components/content/ShareButtons';
import { withHeadingIds, plain } from '@/components/content/data';
import { inr } from '@/lib/format';

type P = { params: Promise<{ slug: string }> };

const findPuja = async (slug: string) => {
  const s = decodeURIComponent(slug);
  return (await db.puja.findUnique({ where: { slug: s } })) || (await db.puja.findMany({ where: { active: true } })).find((p) => p.slug.toLowerCase() === s.toLowerCase()) || null;
};

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const p = await findPuja((await params).slug);
  if (!p) return { title: 'Puja not found' };
  return { title: p.metaTitle || p.name, description: p.metaDesc || plain(p.excerpt).slice(0, 160), openGraph: { images: p.image ? [p.image] : undefined } };
}

export default async function PujaPage({ params }: P) {
  const p = await findPuja((await params).slug);
  if (!p || !p.active) notFound();
  const off = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  const { html } = withHeadingIds(p.body);
  const others = await db.puja.findMany({ where: { active: true, id: { not: p.id } }, take: 3, orderBy: { tier: 'desc' } });

  return (
    <>
      <section className="night">
        <div className="container-x py-8 sm:py-12">
          <Breadcrumbs items={[{ label: 'Online Puja', href: '/astrology-services/online-pooja-booking' }, { label: p.name }]} dark />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-night-800 ring-1 ring-white/10">
              {p.image ? <Image src={p.image} alt={p.name} fill priority sizes="(max-width:1024px) 100vw, 50vw" className="object-cover" /> : <div className="grid h-full place-items-center"><Flame className="h-14 w-14 text-gold-300" /></div>}
            </div>
            <div>
              {p.tier === 'vip' && <span className="rounded-full bg-gold-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-300">VIP Puja</span>}
              <h1 className="h-display mt-3 text-3xl leading-tight text-white sm:text-5xl">{p.name}</h1>
              <p className="mt-4 text-white/70">{plain(p.excerpt)}</p>
              <div className="mt-6 flex items-end gap-3">
                <span className="font-display text-4xl font-semibold text-white">{inr(p.price)}</span>
                {off > 0 && <><span className="pb-1 text-lg text-white/45 line-through">{inr(p.mrp)}</span><span className="mb-1 rounded-full bg-leaf px-2.5 py-0.5 text-xs font-bold text-white">{off}% off</span></>}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
                <span className="flex items-center gap-1.5"><Video className="h-4 w-4 text-gold-300" /> Live video link</span>
                <span className="flex items-center gap-1.5"><ScrollText className="h-4 w-4 text-gold-300" /> Sankalp in your name</span>
                <span className="flex items-center gap-1.5"><Gift className="h-4 w-4 text-gold-300" /> Prasad delivered</span>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <a href="#book" className="btn-gold btn-lg">Book this puja</a>
                <ShareButtons title={p.name} dark />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="min-w-0">
          <div className="mb-10 grid gap-3 sm:grid-cols-4">
            {[
              [CalendarCheck, 'Pick a date', 'Choose an auspicious day'],
              [ScrollText, 'Share details', 'Name, gotra & sankalp'],
              [Video, 'Watch live', 'Join the video link'],
              [Gift, 'Receive prasad', 'Delivered to your home'],
            ].map(([I, t, d], i) => {
              const Ico = I as typeof Video;
              return (
                <div key={t as string} className="card p-4">
                  <span className="flex items-center gap-2 text-xs font-bold text-saffron-600"><Ico className="h-4 w-4" /> Step {i + 1}</span>
                  <p className="mt-2 font-semibold">{t as string}</p>
                  <p className="text-xs text-muted">{d as string}</p>
                </div>
              );
            })}
          </div>
          {p.summary && (
            <div className="mb-8 rounded-3xl border border-gold-400/40 bg-gradient-to-br from-cream-50 to-saffron-50 p-6">
              <p className="eyebrow mb-2">At a glance</p>
              <div className="prose-guru [&_p]:my-1.5" dangerouslySetInnerHTML={{ __html: p.summary }} />
            </div>
          )}
          <div className="prose-guru max-w-[72ch]" dangerouslySetInnerHTML={{ __html: html }} />
        </div>

        <aside id="book" className="scroll-mt-24">
          <div className="card sticky top-24 p-6">
            <p className="font-display text-xl font-semibold">Book {p.name}</p>
            <p className="mb-5 mt-1 flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5 text-leaf" /> Secure booking · Performed by Vedic pandits</p>
            <PujaBookingForm puja={{ id: p.id, slug: p.slug, name: p.name, price: p.price, mrp: p.mrp }} />
          </div>
        </aside>
      </section>

      {others.length > 0 && (
        <section className="container-x pb-8">
          <h2 className="h-display mb-6 text-2xl text-night-900">Other pujas</h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {others.map((o) => (
              <Link key={o.id} href={`/puja/${o.slug}`} className="card-hover group flex gap-4 p-3">
                <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-cream-200">{o.image && <Image src={o.image} alt="" fill sizes="96px" className="object-cover" />}</div>
                <div className="min-w-0 py-1"><p className="line-clamp-2 font-semibold leading-snug group-hover:text-saffron-700">{o.name}</p><p className="mt-1 text-sm font-bold">{inr(o.price)}</p></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
