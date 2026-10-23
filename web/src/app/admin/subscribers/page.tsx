import { Download } from 'lucide-react';
import { db } from '@/lib/db';
import { fmtDateTime } from '@/lib/format';
import { FilterBar, PageHeader, Pager, Table, pageParam } from '@/components/admin/ui';

export const metadata = { title: 'Subscribers' };
const PER = 50;

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const where = q ? { email: { contains: q } } : {};
  const [rows, total] = await Promise.all([
    db.subscriber.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER }),
    db.subscriber.count({ where }),
  ]);
  return (
    <>
      <PageHeader title="Newsletter subscribers" sub={`${total} subscribers`} actions={<a href="/api/admin/subscribers/export" className="btn-dark btn-sm"><Download className="h-4 w-4" /> Export CSV</a>} />
      <FilterBar q={q} placeholder="Search email" />
      <Table head={['Email', 'Subscribed']} empty={!rows.length}>
        {rows.map((s) => (
          <tr key={s.id}>
            <td className="font-medium">{s.email}</td>
            <td className="text-muted">{fmtDateTime(s.createdAt)}</td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/subscribers" params={{ q }} />
    </>
  );
}
