'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ActionButton, useAdminCall } from './client';
import { Section } from './ui';

export function UserActions({ id, blocked, role, canBeAstrologer }: { id: string; blocked: boolean; role: string; canBeAstrologer: boolean }) {
  const { call, busy } = useAdminCall();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [dir, setDir] = useState<'credit' | 'debit'>('credit');

  const adjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Math.abs(Number(amount));
    const ok = await call(`/api/admin/users/${id}/wallet`, 'POST', { amount: dir === 'credit' ? n : -n, note }, dir === 'credit' ? `₹${n} credited` : `₹${n} debited`);
    if (ok) { setAmount(''); setNote(''); }
  };

  return (
    <>
      <Section title="Wallet adjustment">
        <form onSubmit={adjust} className="space-y-3">
          <div className="flex rounded-xl bg-cream-200 p-1 text-sm font-semibold">
            {(['credit', 'debit'] as const).map((d) => (
              <button key={d} type="button" onClick={() => setDir(d)} className={`flex-1 rounded-lg py-1.5 capitalize ${dir === d ? 'bg-white shadow-sm' : 'text-muted'}`}>{d}</button>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="amt">Amount (₹)</label>
            <input id="amt" className="input" type="number" min="1" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="note">Note (shown to user)</label>
            <input id="note" className="input" required value={note} onChange={(e) => setNote(e.target.value)} placeholder={dir === 'credit' ? 'e.g. Goodwill credit for dropped call' : 'e.g. Reversal of duplicate credit'} />
          </div>
          <button className={dir === 'credit' ? 'btn-primary w-full' : 'btn-dark w-full'} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : dir === 'credit' ? 'Credit wallet' : 'Debit wallet'}
          </button>
        </form>
      </Section>
      <Section title="Account">
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="role">Role</label>
            <select id="role" className="input" defaultValue={role} disabled={busy} onChange={(e) => call(`/api/admin/users/${id}`, 'PATCH', { role: e.target.value }, 'Role updated')}>
              <option value="USER">User</option>
              <option value="ASTROLOGER" disabled={!canBeAstrologer}>Astrologer{canBeAstrologer ? '' : ' (needs approved profile)'}</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {blocked ? (
            <ActionButton url={`/api/admin/users/${id}`} payload={{ blocked: false }} success="User unblocked" className="btn-ghost w-full">Unblock user</ActionButton>
          ) : (
            <ActionButton url={`/api/admin/users/${id}`} payload={{ blocked: true }} success="User blocked" confirm="Blocked users are signed out of every feature and cannot log in." danger className="btn-ghost w-full">Block user</ActionButton>
          )}
        </div>
      </Section>
    </>
  );
}
