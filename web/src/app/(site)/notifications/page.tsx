import type { Metadata } from 'next';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { EmptyState } from '@/components/ui/primitives';
import { MarkAllRead } from '@/components/consult/MarkAllRead';
import { cx, fmtDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Notifications', robots: { index: false } };

export default async function NotificationsPage() {
  const u = await requireUser(undefined, '/notifications');
  const items = await db.notification.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' }, take: 60 });
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="container-x max-w-3xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1 className="h-display mt-1 text-3xl text-night-900">Notifications</h1>
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>
      {items.length === 0 ? (
        <div className="mt-6"><EmptyState title="All caught up" text="Updates about consultations, payments and bookings appear here." /></div>
      ) : (
        <ul className="card mt-6 divide-y divide-line overflow-hidden">
          {items.map((n) => {
            const body = (
              <div className={cx('flex gap-3 px-4 py-4 transition', !n.read && 'bg-saffron-50/60', n.link && 'hover:bg-cream-100')}>
                <span className={cx('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full', n.read ? 'bg-cream-200 text-muted' : 'bg-saffron-500 text-white')}><Bell className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{n.title}</p>
                  {n.body && <p className="text-sm text-ink/75">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted">{fmtDateTime(n.createdAt)}</p>
                </div>
                {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-saffron-500" aria-label="Unread" />}
              </div>
            );
            return <li key={n.id}>{n.link ? <Link href={n.link}>{body}</Link> : body}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
