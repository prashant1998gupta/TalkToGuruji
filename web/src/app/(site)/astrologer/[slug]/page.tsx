import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Award, BadgeCheck, Clock, Languages, MapPin, MessageSquareQuote, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { astroCardSelect } from '@/lib/queries';
import { Avatar, Breadcrumbs, Stars } from '@/components/ui/primitives';
import { ProfileActions } from '@/components/consult/ProfileActions';
import { AstroRail } from '@/components/consult/AstroRail';
import { fmtDate, splitList } from '@/lib/format';

export const dynamic = 'force-dynamic';

const getAstro = (slug: string) =>
  db.astrologer.findFirst({
    where: { slug, status: 'APPROVED' },
    include: { reviews: { where: { hidden: false }, orderBy: { createdAt: 'desc' }, take: 30, include: { user: { select: { name: true } } } } },
  });

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const a = await getAstro((await params).slug);
  if (!a) return { title: 'Astrologer not found' };
  return { title: `${a.displayName} — ${splitList(a.skills)[0] || 'Astrologer'}`, description: a.bio.slice(0, 160) };
}

export default async function AstrologerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const a = await getAstro((await params).slug);
  if (!a) notFound();

  const all = await db.review.groupBy({ by: ['rating'], where: { astrologerId: a.id, hidden: false }, _count: true });
  const dist = [5, 4, 3, 2, 1].map((r) => ({ r, n: all.find((x) => x.rating === r)?._count || 0 }));
  const total = dist.reduce((s, d) => s + d.n, 0) || 1;

  const skills = splitList(a.skills);
  const similarRows = await db.astrologer.findMany({
    where: { status: 'APPROVED', id: { not: a.id }, OR: skills.slice(0, 2).map((s) => ({ skills: { contains: s } })) },
    select: astroCardSelect, take: 8, orderBy: { rating: 'desc' },
  });
  const simStatuses = Object.fromEntries(similarRows.map((r) => [r.id, { isOnline: r.isOnline, isBusy: r.isBusy }]));
  const simCards = similarRows.map(({ isOnline, isBusy, ...r }) => r); // eslint-disable-line @typescript-eslint/no-unused-vars

  const stats = [
    { icon: Award, v: `${a.experience} yrs`, l: 'Experience' },
    { icon: Clock, v: `${Math.round(a.totalMinutes / 1000)}k`, l: 'Minutes consulted' },
    { icon: MessageSquareQuote, v: String(a.ratingCount), l: 'Reviews' },
  ];

  return (
    <>
      <section className="night relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        <div className="container-x relative py-10 sm:py-14">
          <Breadcrumbs dark items={[{ label: 'Astrologers', href: '/astrology-services/chat-with-astrologer' }, { label: a.displayName }]} />
          <div className="mt-6 grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="relative mx-auto lg:mx-0">
              <div className="absolute -inset-3 rounded-full bg-gradient-to-br from-gold-400/40 to-saffron-500/20 blur-xl" />
              <Avatar name={a.displayName} src={a.avatar} size={168} className="relative" />
            </div>
            <div className="text-center lg:text-left">
              <h1 className="h-display flex flex-wrap items-center justify-center gap-2 text-3xl text-white sm:text-4xl lg:justify-start">
                {a.displayName} <BadgeCheck className="h-7 w-7 fill-saffron-500 text-night-900" />
              </h1>
              <p className="mt-1 text-white/70">{skills.join(' · ')}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/60 lg:justify-start">
                <span className="flex items-center gap-1.5"><Stars value={a.rating} /> <b className="text-white">{a.rating.toFixed(1)}</b></span>
                <span className="flex items-center gap-1.5"><Languages className="h-4 w-4" /> {splitList(a.languages).join(', ')}</span>
                {a.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {a.city}</span>}
              </div>
              <div className="mt-6 flex justify-center lg:justify-start">
                <ProfileActions
                  astro={{ id: a.id, displayName: a.displayName, avatar: a.avatar, chatPrice: a.chatPrice, callPrice: a.callPrice, videoPrice: a.videoPrice, freeMinutes: a.freeMinutes, isChat: a.isChat, isCall: a.isCall, isVideo: a.isVideo }}
                  status={{ isOnline: a.isOnline, isBusy: a.isBusy }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x grid gap-6 py-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            {stats.map(({ icon: I, v, l }) => (
              <div key={l} className="card p-4 text-center">
                <I className="mx-auto h-5 w-5 text-saffron-500" />
                <p className="mt-2 font-display text-2xl font-semibold text-night-900">{v}</p>
                <p className="text-xs text-muted">{l}</p>
              </div>
            ))}
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold">About {a.displayName.split(' ').slice(-1)[0]}</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/80">{a.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((s) => <span key={s} className="chip"><Sparkles className="h-3 w-3 text-saffron-500" />{s}</span>)}
              {a.qualification && <span className="chip"><Award className="h-3 w-3 text-saffron-500" />{a.qualification}</span>}
            </div>
            {a.freeMinutes > 0 && <p className="mt-5 rounded-xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf">New here? Your first {a.freeMinutes} minutes with {a.displayName} are free.</p>}
          </div>
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold">User reviews</h2>
            {a.reviews.length === 0 && <p className="mt-3 text-sm text-muted">No reviews yet — be the first to consult.</p>}
            <ul className="mt-2 divide-y divide-line">
              {a.reviews.map((r) => (
                <li key={r.id} className="flex gap-3 py-4">
                  <Avatar name={r.user.name || 'User'} size={40} />
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">{maskName(r.user.name)} <Stars value={r.rating} size={12} /></p>
                    {r.comment && <p className="mt-1 text-sm text-ink/80">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted">{fmtDate(r.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-display text-xl font-semibold">Rating</h2>
            <div className="mt-3 flex items-end gap-3">
              <p className="font-display text-5xl font-semibold text-night-900">{a.rating.toFixed(1)}</p>
              <div className="pb-1.5"><Stars value={a.rating} /><p className="text-xs text-muted">{a.ratingCount} ratings</p></div>
            </div>
            <div className="mt-4 space-y-1.5">
              {dist.map(({ r, n }) => (
                <div key={r} className="flex items-center gap-2 text-xs">
                  <span className="w-3 font-semibold">{r}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-saffron-500" style={{ width: `${(n / total) * 100}%` }} />
                  </div>
                  <span className="w-6 text-right text-muted">{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="card p-6 text-sm text-ink/80">
            <h2 className="font-display text-xl font-semibold text-ink">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-saffron-600">
              <li>Choose chat, call or video above.</li>
              <li>Share your birth details — {a.displayName.split(' ').slice(-1)[0]} sees them before accepting.</li>
              <li>Pay per minute from your wallet and end any time.</li>
            </ol>
          </div>
        </aside>
      </section>

      {simCards.length > 0 && (
        <section className="container-x pb-6">
          <h2 className="h-display mb-5 text-2xl text-night-900">Similar astrologers</h2>
          <AstroRail astrologers={simCards} statuses={simStatuses} />
        </section>
      )}
    </>
  );
}

const maskName = (n: string | null) => {
  const s = (n || 'User').trim();
  return s.split(' ')[0] + (s.includes(' ') ? ' ' + s.split(' ').slice(-1)[0][0] + '.' : '');
};
