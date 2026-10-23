import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { Sidebar } from '@/components/admin/Sidebar';

export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Admin | Talk to Guruji' }, robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireUser(['ADMIN'], '/admin');
  const [pendingAstro, pendingBookings, newOrders, messages] = await Promise.all([
    db.astrologer.count({ where: { status: 'PENDING' } }),
    db.pujaBooking.count({ where: { status: 'CONFIRMED' } }),
    db.order.count({ where: { status: 'PLACED' } }),
    db.contactMessage.count({ where: { handled: false } }),
  ]);
  return (
    <div className="min-h-dvh bg-cream-100 lg:flex">
      <Sidebar badges={{ pendingAstro, pendingBookings, newOrders, messages }} adminName={admin.name || admin.phone} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
    </div>
  );
}
