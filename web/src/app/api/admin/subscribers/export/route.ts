import { db } from '@/lib/db';
import { adminRoute } from '@/components/admin/server-utils';

export const GET = adminRoute(async () => {
  const rows = await db.subscriber.findMany({ orderBy: { createdAt: 'desc' } });
  const csv = ['email,subscribed_at', ...rows.map((r) => `"${r.email.replace(/"/g, '""')}",${r.createdAt.toISOString()}`)].join('\n');
  return new Response(csv, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
});
