import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Search } from 'lucide-react';
import { db } from '@/lib/db';
import { EmptyState, PageHero, Pagination } from '@/components/ui/primitives';
import { ContentCard } from '@/components/ui/ContentCard';
import { cx, fmtDate, json, readingTime } from '@/lib/format';
import { Article } from './Article';
import { TYPES, findContent, hrefFor, plain, type ContentType } from './data';

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export type IndexOptions = {
  type: ContentType;
  perPage?: number;
  categories?: boolean;
  search?: boolean;
  featured?: boolean;
  aspect?: 'video' | 'square' | 'portrait';
  showDates?: boolean;
  order?: 'new' | 'title' | 'old';
};

/** Paginated, searchable grid of one content type. */
export async function ContentIndex({ searchParams, opts }: { searchParams: SP; opts: IndexOptions }) {
  const sp = await searchParams;
  const meta = TYPES[opts.type];
  const per = opts.perPage ?? 9;
  const q = one(sp.q).trim();
  const category = one(sp.category);
  const page = Math.max(1, parseInt(one(sp.page)) || 1);

  const where = {
    type: opts.type,
    published: true,
    ...(category ? { category } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { excerpt: { contains: q } }] } : {}),
  };
  const orderBy = opts.order === 'title' ? { title: 'asc' as const } : opts.order === 'old' ? { createdAt: 'asc' as const } : { createdAt: 'desc' as const };
  const [total, items, cats] = await Promise.all([
    db.content.count({ where }),
    db.content.findMany({ where, orderBy, skip: (page - 1) * per, take: per }),
    opts.categories ? db.content.groupBy({ by: ['category'], where: { type: opts.type, published: true }, _count: true, orderBy: { _count: { category: 'desc' } } }) : Promise.resolve([]),
  ]);
  const pages = Math.max(1, Math.ceil(total / per));
  const qs = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    const merged = { q, category, page: undefined as number | undefined, ...p };
    Object.entries(merged).forEach(([k, v]) => v && u.set(k, String(v)));
    const s = u.toString();
    return `${meta.base}${s ? `?${s}` : ''}`;
  };
  const showFeatured = opts.featured && page === 1 && !q && !category && items.length > 3;
  const [first, ...rest] = items;
  const grid = showFeatured ? rest : items;

  return (
    <>
      <PageHero eyebrow={meta.eyebrow} title={meta.label} intro={meta.intro} crumbs={[{ label: meta.label }]}>
        {opts.search && (
          <form action={meta.base} className="flex max-w-lg rounded-full bg-white/5 p-1.5 ring-1 ring-white/15 focus-within:ring-gold-400">
            {category && <input type="hidden" name="category" value={category} />}
            <Search className="ml-3 h-5 w-5 self-center text-white/40" />
            <input name="q" defaultValue={q} placeholder={`Search ${meta.label.toLowerCase()}…`} aria-label="Search" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-white placeholder:text-white/40 outline-none" />
            <button className="btn-gold btn-sm">Search</button>
          </form>
        )}
      </PageHero>

      <section className="container-x py-10 sm:py-14">
        {opts.categories && cats.length > 1 && (
          <div className="no-scrollbar -mx-4 mb-8 flex gap-2 overflow-x-auto px-4">
            <Link href={qs({ category: undefined })} className={cx('shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition', !category ? 'bg-night-900 text-white ring-night-900' : 'bg-white text-ink/75 ring-line hover:ring-saffron-300')}>All {meta.label.toLowerCase()}</Link>
            {cats.filter((c) => c.category).map((c) => (
              <Link key={c.category} href={qs({ category: c.category!, page: undefined })} className={cx('shrink-0 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition', category === c.category ? 'bg-night-900 text-white ring-night-900' : 'bg-white text-ink/75 ring-line hover:ring-saffron-300')}>
                {c.category} <span className="ml-1 text-xs opacity-60">{c._count}</span>
              </Link>
            ))}
          </div>
        )}

        {q && <p className="mb-6 text-sm text-muted">{total} result{total === 1 ? '' : 's'} for “<b className="text-ink">{q}</b>” · <Link href={qs({ q: undefined })} className="font-semibold text-saffron-600">Clear</Link></p>}

        {items.length === 0 ? (
          <EmptyState title="Nothing found" text="Try a different search or category." action={<Link href={meta.base} className="btn-ghost">View all</Link>} />
        ) : (
          <>
            {showFeatured && first && (
              <Link href={hrefFor(first.type, first.slug)} className="card-hover group mb-8 grid overflow-hidden lg:grid-cols-[1.25fr_1fr]">
                <div className="relative aspect-[16/10] overflow-hidden bg-cream-200 lg:aspect-auto lg:min-h-[340px]">
                  {first.image && <Image src={first.image} alt={first.title} fill priority sizes="(max-width:1024px) 100vw, 55vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" />}
                </div>
                <div className="flex flex-col justify-center p-6 sm:p-10">
                  <p className="eyebrow">Featured{first.category ? ` · ${first.category}` : ''}</p>
                  <h2 className="h-display mt-3 text-2xl leading-snug text-night-900 group-hover:text-saffron-700 sm:text-3xl">{first.title}</h2>
                  {first.excerpt && <p className="mt-3 text-muted line-clamp-3">{first.excerpt}</p>}
                  <p className="mt-5 text-xs font-medium text-muted">{first.author ? `${first.author} · ` : ''}{fmtDate(first.createdAt)} · {readingTime(first.body)} min read</p>
                </div>
              </Link>
            )}
            <div className={cx('grid gap-5 sm:grid-cols-2', opts.aspect === 'portrait' ? 'grid-cols-2 lg:grid-cols-4' : 'lg:grid-cols-3')}>
              {grid.map((c, i) => (
                <ContentCard
                  key={c.id}
                  href={hrefFor(c.type, c.slug)}
                  title={c.title}
                  image={c.image}
                  excerpt={opts.aspect === 'portrait' ? null : c.excerpt}
                  tag={opts.categories ? c.category : null}
                  date={opts.showDates ? c.createdAt : null}
                  meta={opts.showDates ? `${readingTime(c.body)} min read` : undefined}
                  aspect={opts.aspect}
                  priority={i < 3 && !showFeatured}
                />
              ))}
            </div>
            <Pagination page={page} pages={pages} href={(p) => qs({ page: p > 1 ? p : undefined })} />
          </>
        )}
      </section>
    </>
  );
}

/** Detail page for one content item, with related items of the same type. */
export async function ContentDetail({ type, slug }: { type: ContentType; slug: string }) {
  const item = await findContent(type, slug);
  if (!item) notFound();
  const meta = TYPES[type];
  const related = await db.content.findMany({
    where: { type, published: true, id: { not: item.id }, ...(item.category && (type === 'blog' || type === 'news') ? { category: item.category } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });
  const extra = json<{ table?: string }>(item.extra, {});
  return (
    <Article
      item={item}
      crumbs={[{ label: meta.label, href: meta.base }, { label: item.title }]}
      related={related}
      relatedTitle={type === 'blog' ? 'Related posts' : `More ${meta.label.toLowerCase()}`}
      extraHtml={type === 'tarot' ? extra.table : null}
      hideDate={!['blog', 'news'].includes(type)}
    />
  );
}

export async function contentMetadata(type: ContentType, slug: string): Promise<Metadata> {
  const item = await findContent(type, slug);
  if (!item) return { title: 'Not found' };
  const description = item.metaDesc || item.excerpt || plain(item.body).slice(0, 160);
  return {
    title: item.metaTitle || item.title,
    description,
    openGraph: { title: item.metaTitle || item.title, description, images: item.image ? [item.image] : undefined, type: 'article' },
  };
}
