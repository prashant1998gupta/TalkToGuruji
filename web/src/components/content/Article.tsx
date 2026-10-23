import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Clock, MessageCircle, Phone, UserRound } from 'lucide-react';
import type { Content } from '@prisma/client';
import { Breadcrumbs, type Crumb } from '@/components/ui/primitives';
import { ContentCard } from '@/components/ui/ContentCard';
import { ShareButtons } from './ShareButtons';
import { hrefFor, withHeadingIds } from './data';
import { fmtDate, readingTime } from '@/lib/format';

type Props = {
  item: Content;
  crumbs: Crumb[];
  related?: Content[];
  relatedTitle?: string;
  /** Extra HTML block appended after the body (e.g. tarot table). */
  extraHtml?: string | null;
  badge?: React.ReactNode;
  hideDate?: boolean;
};

/** Long-form article layout shared by blogs, news, rituals, remedies, vastu, numerology and tarot. */
export function Article({ item, crumbs, related = [], relatedTitle = 'You may also like', extraHtml, badge, hideDate }: Props) {
  const { html, toc } = withHeadingIds(item.body);
  const showToc = toc.length >= 3;
  const mins = readingTime(item.body);

  return (
    <article>
      <header className="night relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,.55)_1px,transparent_1px)] [background-size:30px_30px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        <div className="container-x relative grid gap-8 py-10 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <Breadcrumbs items={crumbs} dark />
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {item.category && <span className="rounded-full bg-saffron-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-saffron-300">{item.category}</span>}
              {badge}
            </div>
            <h1 className="h-display mt-3 text-3xl leading-tight text-white sm:text-[2.6rem]">{item.title}</h1>
            {item.subtitle && item.subtitle !== item.title && <p className="mt-3 text-white/65">{item.subtitle}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-white/60">
              {item.author && <span className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" />{item.author}</span>}
              {!hideDate && <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{fmtDate(item.createdAt, { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{mins} min read</span>
            </div>
            <div className="mt-6"><ShareButtons title={item.title} dark /></div>
          </div>
          {item.image && (
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl ring-1 ring-white/10">
              <Image src={item.image} alt={item.title} fill priority sizes="(max-width:1024px) 100vw, 45vw" className="object-cover" />
            </div>
          )}
        </div>
      </header>

      <div className={`container-x grid gap-10 py-10 sm:py-14 ${showToc ? 'lg:grid-cols-[240px_minmax(0,1fr)_280px]' : 'lg:grid-cols-[minmax(0,1fr)_300px]'}`}>
        {showToc && (
          <aside className="hidden lg:block">
            <nav className="sticky top-28 rounded-2xl border border-line bg-white p-4" aria-label="On this page">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted">On this page</p>
              <ul className="max-h-[60vh] space-y-1 overflow-y-auto text-sm">
                {toc.map((t) => (
                  <li key={t.id} className={t.level === 3 ? 'pl-3' : ''}>
                    <a href={`#${t.id}`} className="block rounded-lg px-2 py-1 leading-snug text-ink/70 transition hover:bg-cream-100 hover:text-saffron-700">{t.text}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        )}

        <div className="min-w-0">
          {showToc && (
            <details className="mb-6 rounded-2xl border border-line bg-white p-4 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold">On this page</summary>
              <ul className="mt-2 space-y-1 text-sm">
                {toc.filter((t) => t.level === 2).map((t) => <li key={t.id}><a href={`#${t.id}`} className="text-ink/75 hover:text-saffron-700">{t.text}</a></li>)}
              </ul>
            </details>
          )}
          <div className="prose-guru max-w-[72ch]" dangerouslySetInnerHTML={{ __html: html }} />
          {extraHtml && <div className="prose-guru mt-8 max-w-[72ch]" dangerouslySetInnerHTML={{ __html: extraHtml }} />}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <p className="text-sm font-semibold text-muted">Found this helpful? Share it.</p>
            <ShareButtons title={item.title} />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="night sticky top-28 overflow-hidden rounded-3xl p-6">
            <p className="eyebrow !text-gold-300">Personal guidance</p>
            <p className="mt-2 font-display text-2xl font-semibold leading-snug text-white">Want to know how this affects your chart?</p>
            <p className="mt-2 text-sm text-white/60">Ask a verified astrologer. First consultations with select experts are free.</p>
            <div className="mt-5 grid gap-2">
              <Link href="/astrology-services/chat-with-astrologer" className="btn-gold"><MessageCircle className="h-4 w-4" /> Chat with Astrologer</Link>
              <Link href="/astrology-services/talk-to-astrologer" className="btn border border-white/15 bg-white/5 text-white hover:bg-white/10"><Phone className="h-4 w-4" /> Talk to Astrologer</Link>
            </div>
          </div>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="container-x pb-6">
          <h2 className="h-display mb-6 text-2xl text-night-900 sm:text-3xl">{relatedTitle}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ContentCard key={r.id} href={hrefFor(r.type, r.slug)} title={r.title} image={r.image} excerpt={r.excerpt} tag={r.category} date={r.type === 'blog' || r.type === 'news' ? r.createdAt : null} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
