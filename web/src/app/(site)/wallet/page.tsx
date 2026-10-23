import type { Metadata } from 'next';
import { CheckCircle2, ShieldCheck, Wallet } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getGstPercent } from '@/lib/settings';
import { rupees } from '@/lib/format';
import { PageHero } from '@/components/ui/primitives';
import { RechargePanel } from '@/components/consult/RechargePanel';
import { TransactionList } from '@/components/consult/TransactionList';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Wallet', robots: { index: false } };

export default async function WalletPage({ searchParams }: { searchParams: Promise<{ need?: string; paid?: string; page?: string }> }) {
  const sp = await searchParams;
  const user = await requireUser(undefined, '/wallet');
  const page = Math.max(1, Number(sp.page) || 1);
  const [packs, txs, total] = await Promise.all([
    db.rechargePack.findMany({ orderBy: { sort: 'asc' } }),
    db.transaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * 15, take: 15 }),
    db.transaction.count({ where: { userId: user.id } }),
  ]);
  const need = Number(sp.need) || 0;
  const GST_PERCENT = await getGstPercent();

  return (
    <>
      <PageHero compact eyebrow="Wallet" title="Add money to your wallet" crumbs={[{ label: 'Wallet' }]} intro="Consultations are billed per minute from your wallet. Recharge once and talk to any astrologer.">
        <div className="inline-flex items-center gap-4 rounded-3xl bg-white/5 px-5 py-4 ring-1 ring-white/10">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-gold-400 to-saffron-500 text-night-900"><Wallet className="h-6 w-6" /></span>
          <div>
            <p className="text-xs text-white/60">Available balance</p>
            <p className="font-display text-3xl font-semibold text-white" data-testid="wallet-balance">{rupees(user.walletBalance)}</p>
          </div>
        </div>
      </PageHero>

      <section className="container-x grid gap-8 py-10 lg:grid-cols-[1.35fr_1fr]">
        <div>
          {sp.paid && (
            <p className="mb-5 flex items-center gap-2 rounded-2xl bg-leaf/10 px-4 py-3 text-sm font-semibold text-leaf"><CheckCircle2 className="h-5 w-5" /> Payment successful — your wallet has been recharged.</p>
          )}
          {need > 0 && !sp.paid && (
            <p className="mb-5 rounded-2xl bg-saffron-50 px-4 py-3 text-sm text-saffron-700 ring-1 ring-saffron-100">
              You need at least <b>{rupees(need)}</b> to start that consultation. Your balance is {rupees(user.walletBalance)}.
            </p>
          )}
          {user.role === 'USER' ? (
            <RechargePanel packs={packs} gst={GST_PERCENT} suggested={need ? Math.max(50, Math.ceil((need - user.walletBalance) / 100)) : 0} />
          ) : (
            <p className="card p-6 text-sm text-muted">Wallet recharges are available on user accounts.</p>
          )}
          <p className="mt-5 flex items-center gap-2 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-leaf" /> Payments are processed securely. {GST_PERCENT}% GST is added at checkout as per government rules.</p>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Transaction history</h2>
          <TransactionList txs={txs} page={page} pages={Math.ceil(total / 15)} basePath="/wallet" />
        </div>
      </section>
    </>
  );
}
