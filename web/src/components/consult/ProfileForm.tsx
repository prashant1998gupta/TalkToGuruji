'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

type P = { name: string; email: string; gender: string; birthDate: string; birthTime: string; birthPlace: string };

export function ProfileForm({ initial }: { initial: P }) {
  const { toast, refresh } = useApp();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof P) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const body = { ...f, gender: f.gender || undefined };
    const r = await fetch('/api/account/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast(j.error, 'error');
    toast('Profile saved', 'success');
    refresh();
  };

  return (
    <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
      <div><label className="label" htmlFor="pf-name">Full name</label><input id="pf-name" className="input" value={f.name} onChange={set('name')} maxLength={60} /></div>
      <div><label className="label" htmlFor="pf-email">Email</label><input id="pf-email" type="email" className="input" value={f.email} onChange={set('email')} /></div>
      <div>
        <label className="label" htmlFor="pf-g">Gender</label>
        <select id="pf-g" className="input" value={f.gender} onChange={set('gender')}>
          <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
        </select>
      </div>
      <div><label className="label" htmlFor="pf-place">Place of birth</label><input id="pf-place" className="input" value={f.birthPlace} onChange={set('birthPlace')} placeholder="City, State" /></div>
      <div><label className="label" htmlFor="pf-dob">Date of birth</label><input id="pf-dob" type="date" className="input" value={f.birthDate} onChange={set('birthDate')} max={new Date().toISOString().slice(0, 10)} /></div>
      <div><label className="label" htmlFor="pf-tob">Time of birth</label><input id="pf-tob" type="time" className="input" value={f.birthTime} onChange={set('birthTime')} /></div>
      <div className="sm:col-span-2">
        <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}</button>
      </div>
    </form>
  );
}
