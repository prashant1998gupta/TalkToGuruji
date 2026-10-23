import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { fmtDate, rupees } from '@/lib/format';
import { FilterBar, PageHeader, Pager, Pill, Select, Table, pageParam } from '@/components/admin/ui';

export const metadata = { title: 'Users' };
const PER = 25;

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = sp.q?.trim();
  const where: Prisma.UserWhereInput = {
    ...(sp.role ? { role: sp.role } : {}),
    ...(sp.blocked === '1' ? { blocked: true } : {}),
    ...(q ? { OR: [{ phone: { contains: q } }, { name: { contains: q } }, { email: { contains: q } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * PER, take: PER, include: { _count: { select: { sessions: true, orders: true } } } }),
    db.user.count({ where }),
  ]);

  return (
    <>
      <PageHeader title="Users" sub="Everyone who has signed in with a mobile number." />
      <FilterBar q={q} placeholder="Search phone, name or email">
        <Select name="role" value={sp.role} label="Role" options={[['', 'All roles'], ['USER', 'Users'], ['ASTROLOGER', 'Astrologers'], ['ADMIN', 'Admins']]} />
        <Select name="blocked" value={sp.blocked} label="Status" options={[['', 'Any status'], ['1', 'Blocked only']]} />
      </FilterBar>
      <Table head={['User', 'Phone', 'Role', 'Wallet', 'Consultations', 'Orders', 'Joined', '']} empty={!rows.length}>
        {rows.map((u) => (
          <tr key={u.id}>
            <td>
              <Link href={`/admin/users/${u.id}`} className="font-semibold text-night-900 hover:text-saffron-700">{u.name || 'Unnamed'}</Link>
              {u.blocked && <span className="ml-2"><Pill v="BLOCKED" /></span>}
            </td>
            <td className="whitespace-nowrap tabular-nums">+91 {u.phone}</td>
            <td><Pill v={u.role} /></td>
            <td className="tabular-nums font-medium">{rupees(u.walletBalance)}</td>
            <td className="tabular-nums">{u._count.sessions}</td>
            <td className="tabular-nums">{u._count.orders}</td>
            <td className="whitespace-nowrap text-muted">{fmtDate(u.createdAt)}</td>
            <td className="text-right"><Link href={`/admin/users/${u.id}`} className="btn-ghost btn-sm">Open</Link></td>
          </tr>
        ))}
      </Table>
      <Pager page={page} total={total} per={PER} base="/admin/users" params={{ q, role: sp.role, blocked: sp.blocked }} />
    </>
  );
}
