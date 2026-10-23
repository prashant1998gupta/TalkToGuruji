import Link from 'next/link';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import { inr } from '@/lib/format';
import { ActionButton } from '@/components/admin/client';
import { FilterBar, PageHeader, Pill, Table } from '@/components/admin/ui';

export const metadata = { title: 'Pujas' };

export default async function PujasPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = (await searchParams).q?.trim();
  const rows = await db.puja.findMany({
    where: q ? { name: { contains: q } } : {},
    orderBy: [{ tier: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { bookings: true } } },
  });
  return (
    <>
      <PageHeader title="Pujas" sub="The puja catalogue shown on Online Puja Booking." actions={<Link href="/admin/pujas/new" className="btn-primary btn-sm"><Plus className="h-4 w-4" /> New puja</Link>} />
      <FilterBar q={q} placeholder="Search pujas" />
      <Table head={['', 'Puja', 'Tier', 'Price', 'MRP', 'Bookings', 'Status', '']} empty={!rows.length}>
        {rows.map((p) => (
          <tr key={p.id}>
            <td className="w-16">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.image ? <img src={p.image} alt="" className="h-10 w-14 rounded-lg object-cover" loading="lazy" /> : <span className="block h-10 w-14 rounded-lg bg-cream-200" />}
            </td>
            <td><Link href={`/admin/pujas/${p.id}`} className="font-semibold text-night-900 hover:text-saffron-700">{p.name}</Link><div className="text-xs text-muted">/puja/{p.slug}</div></td>
            <td>{p.tier === 'vip' ? <Pill v="VIP" /> : <span className="text-muted">Standard</span>}</td>
            <td className="tabular-nums font-semibold">{inr(p.price)}</td>
            <td className="tabular-nums text-muted">{inr(p.mrp)}</td>
            <td className="tabular-nums">{p._count.bookings}</td>
            <td>
              <ActionButton url={`/api/admin/crud/puja/${p.id}`} payload={{ active: !p.active }} success={p.active ? 'Puja hidden' : 'Puja is live'} className={`btn btn-sm !px-2.5 !py-1 text-[11px] ${p.active ? 'bg-leaf/10 text-leaf' : 'bg-cream-200 text-muted'}`}>
                {p.active ? '● Live' : '○ Hidden'}
              </ActionButton>
            </td>
            <td className="text-right"><Link href={`/admin/pujas/${p.id}`} className="btn-ghost btn-sm">Edit</Link></td>
          </tr>
        ))}
      </Table>
    </>
  );
}
