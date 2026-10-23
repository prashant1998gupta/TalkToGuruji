import { requireUser } from '@/lib/auth';
import { AccountNav } from '@/components/consult/AccountNav';
import { Avatar } from '@/components/ui/primitives';
import { rupees } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const u = await requireUser(undefined, '/account');
  return (
    <div className="container-x py-8 sm:py-10">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card flex items-center gap-3 p-4 lg:flex-col lg:items-start lg:p-5">
            <Avatar name={u.name || 'User'} size={52} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{u.name || 'Welcome'}</p>
              <p className="text-xs text-muted">+91 {u.phone}</p>
              {u.role === 'USER' && <p className="mt-1 text-xs font-bold text-saffron-700">Wallet {rupees(u.walletBalance)}</p>}
            </div>
          </div>
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
