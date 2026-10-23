import { db } from '@/lib/db';
import { fmtDateTime } from '@/lib/format';
import { ActionButton } from '@/components/admin/client';
import { PageHeader, Tabs } from '@/components/admin/ui';
import { EmptyState } from '@/components/ui/primitives';

export const metadata = { title: 'Messages' };

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const handled = (await searchParams).tab === 'handled';
  const [rows, open, done] = await Promise.all([
    db.contactMessage.findMany({ where: { handled }, orderBy: { createdAt: 'desc' }, take: 100 }),
    db.contactMessage.count({ where: { handled: false } }),
    db.contactMessage.count({ where: { handled: true } }),
  ]);
  return (
    <>
      <PageHeader title="Messages" sub="Submissions from the Contact Us form." />
      <Tabs active={handled ? 'handled' : 'open'} tabs={[{ key: 'open', label: 'Open', href: '/admin/messages', count: open }, { key: 'handled', label: 'Handled', href: '/admin/messages?tab=handled', count: done }]} />
      {!rows.length ? (
        <EmptyState title={handled ? 'No handled messages' : 'Inbox zero'} text={handled ? undefined : 'New contact form messages will appear here.'} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rows.map((m) => (
            <article key={m.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-night-900">{m.name}</p>
                  <p className="text-xs text-muted">
                    <a href={`mailto:${m.email}`} className="hover:text-saffron-700">{m.email}</a>{m.phone && <> · <a href={`tel:${m.phone}`}>{m.phone}</a></>} · {fmtDateTime(m.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <ActionButton url={`/api/admin/messages/${m.id}`} payload={{ handled: !m.handled }} success={m.handled ? 'Moved back to open' : 'Marked handled'} className="btn-ghost btn-sm">{m.handled ? 'Reopen' : 'Mark handled'}</ActionButton>
                  <ActionButton url={`/api/admin/messages/${m.id}`} method="DELETE" success="Message deleted" confirm="Delete this message permanently?" danger className="btn-ghost btn-sm">Delete</ActionButton>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink/85">{m.message}</p>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
