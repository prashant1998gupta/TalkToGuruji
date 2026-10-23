import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import { CONTENT_TYPES } from '@/components/admin/entities';
import { ActionButton } from '@/components/admin/client';
import { FilterBar, PageHeader, Pager, Table, Tabs, pageParam, qs } from '@/components/admin/ui';

export const metadata = { title: 'Content' };
const PER = 30;

// Public URL of each content type (mirrors the website routes)
const PUBLIC: Record<string, (slug: string) => string> = {
  blog: (s) => `/blogs/${s}`, news: (s) => `/astrology-news/${s}`, festival: (s) => `/rituals/festivals/${s}`, vrat: (s) => `/rituals/vrats/${s}`,
  aarti: (s) => `/rituals/aarti/${s}`, bhajan: (s) => `/rituals/bhajan/${s}`, tarot: (s) => `/tarot/${s}`, numerology: (s) => `/numerology/${s}`,
  remedy: (s) => `/remedies/${s}`, vastu: (s) => `/vastu/${s}`, video: (s) => `/videos/${s}`, story: (s) => `/web-stories/${s}`, gallery: (s) => `/photo-gallery/${s}`,
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const type = (CONTENT_TYPES as readonly string[]).includes(sp.type || '') ? sp.type! : 'blog';
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const where: Prisma.ContentWhereInput = {
    type,
    ...(sp.state === 'draft' ? { published: false } : sp.state === 'live' ? { published: true } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { slug: { contains: q } }, { category: { contains: q } }] } : {}),
  };
  const [rows, total, counts] = await Promise.all([
    db.content.findMany({ where, orderBy: type === 'festival' || type === 'vrat' ? { eventDate: 'desc' } : { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, select: { id: true, title: true, slug: true, image: true, category: true, published: true, createdAt: true, updatedAt: true, eventDate: true } }),
    db.content.count({ where }),
    db.content.groupBy({ by: ['type'], _count: true }),
  ]);
  const count = (t: string) => counts.find((c) => c.type === t)?._count ?? 0;

  return (
    <>
      <PageHeader title="Content" sub="Blogs, news, rituals, remedies and every editorial page on the site." actions={<Link href={`/admin/content/new?type=${type}`} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New {type}</Link>} />
      <Tabs active={type} tabs={CONTENT_TYPES.map((t) => ({ key: t, label: t[0].toUpperCase() + t.slice(1), href: qs('/admin/content', { type: t }), count: count(t) }))} />
      <FilterBar q={q} placeholder={`Search ${type} titles`} hidden={{ type }}>
        <select name="state" defaultValue={sp.state || ''} className="input !w-auto" aria-label="Published state">
          <option value="">Live & drafts</option><option value="live">Live only</option><option value="draft">Drafts only</option>
        </select>
      </FilterBar>
      <Table head={['', 'Title', 'Category', type === 'festival' || type === 'vrat' ? 'Date' : 'Created', 'Status', '']} empty={!rows.length}>
        {rows.map((c) => (
          <tr key={c.id}>
            <td className="w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.image ? <img src={c.image} alt="" className="h-10 w-14 rounded-lg object-cover" loading="lazy" /> : <span className="block h-10 w-14 rounded-lg bg-cream-200" />}
            </td>
            <td>
              <Link href={`/admin/content/${c.id}`} className="line-clamp-1 font-semibold text-night-900 hover:text-saffron-700">{c.title}</Link>
              <span className="text-xs text-muted">/{c.slug}</span>
            </td>
            <td className="text-muted">{c.category || '—'}</td>
            <td className="whitespace-nowrap text-muted">{fmtDate((type === 'festival' || type === 'vrat') && c.eventDate ? c.eventDate : c.createdAt)}</td>
            <td>
              <ActionButton url={`/api/admin/crud/content/${c.id}`} payload={{ published: !c.published }} success={c.published ? 'Moved to drafts' : 'Published'} className={`btn btn-sm !px-2.5 !py-1 text-[11px] ${c.published ? 'bg-leaf/10 text-leaf hover:bg-leaf/20' : 'bg-cream-200 text-muted hover:bg-cream-300'}`}>
                {c.published ? '● Live' : '○ Draft'}
              </ActionButton>
            </td>
            <td className="whitespace-nowrap text-right">
              <div className="flex justify-end gap-1.5">
                {c.published && PUBLIC[type] && <Link href={PUBLIC[type](c.slug)} target="_blank" className="btn-ghost btn-sm">View</Link>}
                <Link href={`/admin/content/${c.id}`} className="btn-ghost btn-sm">Edit</Link>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/content" params={{ type, q, state: sp.state }} />
    </>
  );
}
