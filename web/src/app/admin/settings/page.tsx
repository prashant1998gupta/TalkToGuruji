import { db } from '@/lib/db';
import { PageHeader } from '@/components/admin/ui';
import { SettingsEditor } from '@/components/admin/SettingsEditor';

export const metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const rows = await db.setting.findMany({ orderBy: { key: 'asc' } });
  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" sub="Site-wide values such as contact details and GST." />
      <SettingsEditor rows={rows} />
    </div>
  );
}
