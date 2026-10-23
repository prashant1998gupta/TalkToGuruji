import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDate } from '@/lib/format';
import { Stars } from '@/components/ui/primitives';
import { ActionButton } from '@/components/admin/client';
import { FilterBar, PageHeader, Pager, Select, Table, pageParam } from '@/components/admin/ui';

export const metadata = { title: 'Reviews' };
const PER = 30;

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const where: Prisma.ReviewWhereInput = {
    ...(sp.astrologer ? { astrologerId: sp.astrologer } : {}),
    ...(sp.rating ? { rating: { lte: Number(sp.rating) } } : {}),
    ...(sp.hidden === '1' ? { hidden: true } : {}),
    ...(q ? { comment: { contains: q } } : {}),
  };
  const [rows, total, astros] = await Promise.all([
    db.review.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, include: { user: { select: { name: true, phone: true } }, astrologer: { select: { displayName: true } } } }),
    db.review.count({ where }),
    db.astrologer.findMany({ where: { status: { not: 'PENDING' } }, select: { id: true, displayName: true }, orderBy: { displayName: 'asc' } }),
  ]);

  return (
    <>
      <PageHeader title="Reviews" sub="Hidden reviews disappear from the website and are excluded from the astrologer’s rating." />
      <FilterBar q={q} placeholder="Search review text">
        <Select name="astrologer" value={sp.astrologer} label="Astrologer" options={[['', 'All astrologers'], ...astros.map((a) => [a.id, a.displayName] as [string, string])]} />
        <Select name="rating" value={sp.rating} label="Rating" options={[['', 'Any rating'], ['3', '3★ or lower'], ['2', '2★ or lower'], ['1', '1★']]} />
        <Select name="hidden" value={sp.hidden} label="Visibility" options={[['', 'All'], ['1', 'Hidden only']]} />
      </FilterBar>
      <Table head={['Date', 'Astrologer', 'User', 'Rating', 'Comment', '']} empty={!rows.length}>
        {rows.map((r) => (
          <tr key={r.id} className={r.hidden ? 'opacity-55' : ''}>
            <td className="whitespace-nowrap text-muted">{fmtDate(r.createdAt)}</td>
            <td><Link href={`/admin/astrologers/${r.astrologerId}`} className="hover:text-saffron-700">{r.astrologer.displayName}</Link></td>
            <td>{r.user.name || r.user.phone}</td>
            <td><Stars value={r.rating} size={12} /></td>
            <td className="max-w-md"><span className="line-clamp-2">{r.comment || <i className="text-muted">No comment</i>}</span></td>
            <td className="text-right">
              <ActionButton url={`/api/admin/reviews/${r.id}`} payload={{ hidden: !r.hidden }} success={r.hidden ? 'Review visible again' : 'Review hidden'} className="btn-ghost btn-sm">
                {r.hidden ? 'Unhide' : 'Hide'}
              </ActionButton>
            </td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/reviews" params={{ q, astrologer: sp.astrologer, rating: sp.rating, hidden: sp.hidden }} />
    </>
  );
}
