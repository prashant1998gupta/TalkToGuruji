import Link from 'next/link';
import { db } from '@/lib/db';
import { fmtDateTime, rupees } from '@/lib/format';
import { PageHeader, Pill, Section, Stat } from '@/components/admin/ui';
import { RevenueChart } from '@/components/admin/RevenueChart';

export const metadata = { title: 'Dashboard' };

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export default async function AdminDashboard() {
  const today = startOfDay();
  const d14 = new Date(today.getTime() - 13 * 86400000);
  const d30 = new Date(today.getTime() - 29 * 86400000);

  const [users, astros, online, sessionsToday, payToday, pay30, billToday, bill30, pendingAstro, pendingBookings, newOrders, unread, payRows, billRows, sessRows, recentSessions, recentPays, recentUsers] = await Promise.all([
    db.user.count({ where: { role: 'USER' } }),
    db.astrologer.count({ where: { status: 'APPROVED' } }),
    db.astrologer.count({ where: { status: 'APPROVED', isOnline: true } }),
    db.consultSession.count({ where: { createdAt: { gte: today }, status: { in: ['ACTIVE', 'ENDED'] } } }),
    db.paymentOrder.aggregate({ where: { status: 'PAID', updatedAt: { gte: today } }, _sum: { amount: true } }),
    db.paymentOrder.aggregate({ where: { status: 'PAID', updatedAt: { gte: d30 } }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { type: 'CONSULT', createdAt: { gte: today } }, _sum: { amount: true } }),
    db.transaction.aggregate({ where: { type: 'CONSULT', createdAt: { gte: d30 } }, _sum: { amount: true } }),
    db.astrologer.count({ where: { status: 'PENDING' } }),
    db.pujaBooking.count({ where: { status: 'CONFIRMED' } }),
    db.order.count({ where: { status: 'PLACED' } }),
    db.contactMessage.count({ where: { handled: false } }),
    db.paymentOrder.findMany({ where: { status: 'PAID', updatedAt: { gte: d14 } }, select: { amount: true, updatedAt: true } }),
    db.transaction.findMany({ where: { type: 'CONSULT', createdAt: { gte: d14 } }, select: { amount: true, createdAt: true } }),
    db.consultSession.findMany({ where: { createdAt: { gte: d14 }, status: { in: ['ACTIVE', 'ENDED'] } }, select: { createdAt: true } }),
    db.consultSession.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true, phone: true } }, astrologer: { select: { displayName: true } } } }),
    db.paymentOrder.findMany({ orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true, phone: true } } } }),
    db.user.findMany({ where: { role: 'USER' }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(d14.getTime() + i * 86400000);
    return { key: dayKey(d), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), payments: 0, billing: 0, sessions: 0 };
  });
  const byKey = Object.fromEntries(days.map((d) => [d.key, d]));
  for (const p of payRows) { const d = byKey[dayKey(p.updatedAt)]; if (d) d.payments += p.amount / 100; }
  for (const t of billRows) { const d = byKey[dayKey(t.createdAt)]; if (d) d.billing += -t.amount / 100; }
  for (const s of sessRows) { const d = byKey[dayKey(s.createdAt)]; if (d) d.sessions += 1; }

  const paise = (n: number | null | undefined) => rupees(Math.abs(n || 0));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" sub={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Users" value={users.toLocaleString('en-IN')} href="/admin/users" />
        <Stat label="Astrologers" value={astros} hint={<><b className="text-leaf">{online}</b> online now</>} href="/admin/astrologers?status=APPROVED" />
        <Stat label="Consultations today" value={sessionsToday} href="/admin/consultations" />
        <Stat label="Payments today" value={paise(payToday._sum.amount)} hint={`${paise(pay30._sum.amount)} in 30 days`} href="/admin/finance" tone="good" />
        <Stat label="Consult billing today" value={paise(billToday._sum.amount)} hint={`${paise(bill30._sum.amount)} in 30 days`} href="/admin/finance?tab=ledger" />
        <Stat label="Unread messages" value={unread} href="/admin/messages" tone={unread ? 'alert' : 'default'} />
      </div>

      {(pendingAstro > 0 || pendingBookings > 0 || newOrders > 0) && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Astrologer applications" value={pendingAstro} hint="waiting for approval" href="/admin/astrologers?status=PENDING" tone={pendingAstro ? 'alert' : 'default'} />
          <Stat label="Pujas to perform" value={pendingBookings} hint="confirmed bookings" href="/admin/bookings?status=CONFIRMED" tone={pendingBookings ? 'alert' : 'default'} />
          <Stat label="Orders to ship" value={newOrders} hint="placed, not shipped" href="/admin/orders?status=PLACED" tone={newOrders ? 'alert' : 'default'} />
        </div>
      )}

      <Section title="Last 14 days">
        <RevenueChart days={days} />
      </Section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Recent consultations" action={<Link href="/admin/consultations" className="text-xs font-semibold text-saffron-600">View all</Link>}>
          <ul className="divide-y divide-line text-sm">
            {recentSessions.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/consultations/${s.id}`} className="flex items-center gap-3 py-2.5 hover:text-saffron-700">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{s.user.name || s.user.phone} → {s.astrologer.displayName}</span>
                    <span className="text-xs text-muted">{s.type.toLowerCase()} · {s.billedMinutes} min · {fmtDateTime(s.createdAt)}</span>
                  </span>
                  <Pill v={s.status} />
                </Link>
              </li>
            ))}
            {!recentSessions.length && <li className="py-6 text-center text-muted">No consultations yet.</li>}
          </ul>
        </Section>
        <Section title="Recent payments" action={<Link href="/admin/finance" className="text-xs font-semibold text-saffron-600">View all</Link>}>
          <ul className="divide-y divide-line text-sm">
            {recentPays.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.user.name || p.user.phone}</span>
                  <span className="text-xs text-muted">{p.purpose.toLowerCase()} · {fmtDateTime(p.createdAt)}</span>
                </span>
                <b className="tabular-nums">{rupees(p.amount)}</b>
                <Pill v={p.status} />
              </li>
            ))}
            {!recentPays.length && <li className="py-6 text-center text-muted">No payments yet.</li>}
          </ul>
        </Section>
        <Section title="New users" action={<Link href="/admin/users" className="text-xs font-semibold text-saffron-600">View all</Link>}>
          <ul className="divide-y divide-line text-sm">
            {recentUsers.map((u) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-saffron-700">
                  <span className="min-w-0"><span className="block truncate font-medium">{u.name || 'Unnamed'}</span><span className="text-xs text-muted">+91 {u.phone}</span></span>
                  <span className="text-xs text-muted">{fmtDateTime(u.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
