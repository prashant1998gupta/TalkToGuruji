import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await currentUser();
  if (!u) return Response.json({ user: null });
  const unread = await db.notification.count({ where: { userId: u.id, read: false } });
  return Response.json({
    user: {
      id: u.id, phone: u.phone, name: u.name, email: u.email, role: u.role, walletBalance: u.walletBalance, unread,
      astrologer: u.astrologer ? { id: u.astrologer.id, slug: u.astrologer.slug, displayName: u.astrologer.displayName, status: u.astrologer.status, isOnline: u.astrologer.isOnline } : null,
    },
  });
}
