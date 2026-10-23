import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { fmtDate, fmtDateTime, rupees } from '@/lib/format';
import { KV, PageHeader, Pill, Section, Table } from '@/components/admin/ui';
import { UserActions } from '@/components/admin/UserActions';

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const u = await db.user.findUnique({
    where: { id },
    include: {
      astrologer: true,
      transactions: { orderBy: { createdAt: 'desc' }, take: 30 },
      sessions: { orderBy: { createdAt: 'desc' }, take: 20, include: { astrologer: { select: { displayName: true } } } },
      orders: { orderBy: { createdAt: 'desc' }, take: 10 },
      bookings: { orderBy: { createdAt: 'desc' }, take: 10, include: { puja: { select: { name: true } } } },
    },
  });
  if (!u) notFound();

  return (
    <>
      <Link href="/admin/users" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Users</Link>
      <PageHeader title={u.name || 'Unnamed user'} sub={<>+91 {u.phone} · joined {fmtDate(u.createdAt)} · <Pill v={u.role} /> {u.blocked && <Pill v="BLOCKED" />}</>} />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <Section title="Profile">
            <KV rows={[
              ['Email', u.email], ['Gender', u.gender], ['Birth date', u.birthDate], ['Birth time', u.birthTime], ['Birth place', u.birthPlace],
              ['Wallet', <b key="w" className="text-lg">{rupees(u.walletBalance)}</b>],
              ['Astrologer', u.astrologer ? <Link key="a" href={`/admin/astrologers/${u.astrologer.id}`} className="text-saffron-700 underline">{u.astrologer.displayName} ({u.astrologer.status.toLowerCase()})</Link> : null],
            ]} />
          </Section>
          <UserActions id={u.id} blocked={u.blocked} role={u.role} canBeAstrologer={u.astrologer?.status === 'APPROVED'} />
        </div>
        <div className="space-y-6">
          <Section title="Wallet transactions">
            <Table head={['When', 'Type', 'Note', 'Amount', 'Balance']} empty={!u.transactions.length}>
              {u.transactions.map((t) => (
                <tr key={t.id}>
                  <td className="whitespace-nowrap text-muted">{fmtDateTime(t.createdAt)}</td>
                  <td><Pill v={t.type} /></td>
                  <td className="max-w-xs truncate">{t.note}</td>
                  <td className={`tabular-nums font-semibold ${t.amount < 0 ? 'text-rose' : 'text-leaf'}`}>{t.amount < 0 ? '−' : '+'}{rupees(Math.abs(t.amount))}</td>
                  <td className="tabular-nums">{rupees(t.balanceAfter)}</td>
                </tr>
              ))}
            </Table>
          </Section>
          <Section title="Consultations">
            <Table head={['When', 'Astrologer', 'Type', 'Minutes', 'Charged', 'Status']} empty={!u.sessions.length}>
              {u.sessions.map((s) => (
                <tr key={s.id}>
                  <td className="whitespace-nowrap"><Link href={`/admin/consultations/${s.id}`} className="text-saffron-700 hover:underline">{fmtDateTime(s.createdAt)}</Link></td>
                  <td>{s.astrologer.displayName}</td>
                  <td>{s.type}</td>
                  <td className="tabular-nums">{s.billedMinutes}</td>
                  <td className="tabular-nums">{rupees(s.amount)}</td>
                  <td><Pill v={s.status} /></td>
                </tr>
              ))}
            </Table>
          </Section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Orders">
              <ul className="divide-y divide-line text-sm">
                {u.orders.map((o) => <li key={o.id} className="flex justify-between py-2"><span>#{o.id.slice(-6).toUpperCase()} · {fmtDate(o.createdAt)}</span><span className="flex gap-2">{rupees(o.amount)} <Pill v={o.status} /></span></li>)}
                {!u.orders.length && <li className="py-4 text-muted">No orders.</li>}
              </ul>
            </Section>
            <Section title="Puja bookings">
              <ul className="divide-y divide-line text-sm">
                {u.bookings.map((b) => <li key={b.id} className="flex justify-between gap-2 py-2"><span className="truncate">{b.puja.name} · {b.date}</span><Pill v={b.status} /></li>)}
                {!u.bookings.length && <li className="py-4 text-muted">No bookings.</li>}
              </ul>
            </Section>
          </div>
        </div>
      </div>
    </>
  );
}
