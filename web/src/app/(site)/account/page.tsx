import type { Metadata } from 'next';
import Link from 'next/link';
import { MessageCircle, Orbit, Wallet } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { rupees } from '@/lib/format';
import { ProfileForm } from '@/components/consult/ProfileForm';

export const metadata: Metadata = { title: 'My account', robots: { index: false } };

export default async function AccountPage() {
  const u = await requireUser(undefined, '/account');
  const [sessions, spent] = await Promise.all([
    db.consultSession.count({ where: { userId: u.id, status: 'ENDED' } }),
    db.consultSession.aggregate({ where: { userId: u.id, status: 'ENDED' }, _sum: { amount: true, billedMinutes: true } }),
  ]);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { i: MessageCircle, v: String(sessions), l: 'Consultations' },
          { i: Orbit, v: `${spent._sum.billedMinutes || 0} min`, l: 'Time with astrologers' },
          { i: Wallet, v: rupees(u.walletBalance), l: 'Wallet balance', href: '/wallet' },
        ].map(({ i: I, v, l, href }) => {
          const body = (
            <>
              <I className="h-5 w-5 text-saffron-500" />
              <p className="mt-2 font-display text-2xl font-semibold text-night-900">{v}</p>
              <p className="text-xs text-muted">{l}</p>
            </>
          );
          return href ? <Link key={l} href={href} className="card-hover p-4">{body}</Link> : <div key={l} className="card p-4">{body}</div>;
        })}
      </div>
      <div className="card p-5 sm:p-6">
        <h1 className="font-display text-2xl font-semibold">Profile & birth details</h1>
        <p className="mt-1 text-sm text-muted">Saved birth details are pre-filled when you start a consultation or make a kundli.</p>
        <ProfileForm initial={{ name: u.name || '', email: u.email || '', gender: u.gender || '', birthDate: u.birthDate || '', birthTime: u.birthTime || '', birthPlace: u.birthPlace || '' }} />
      </div>
      {u.role === 'USER' && !u.astrologer && (
        <Link href="/astro-registration" className="card-hover flex items-center justify-between gap-4 p-5">
          <span><span className="block font-semibold">Are you an astrologer?</span><span className="text-sm text-muted">Apply to join the Talk to Guruji panel.</span></span>
          <span className="btn-dark btn-sm">Apply</span>
        </Link>
      )}
    </div>
  );
}
