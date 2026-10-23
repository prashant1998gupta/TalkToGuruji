'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, Phone, Video } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { cx } from '@/lib/format';

type F = {
  displayName: string; bio: string; skills: string; languages: string; experience: number; qualification: string; city: string;
  chatPrice: number; callPrice: number; videoPrice: number; isChat: boolean; isCall: boolean; isVideo: boolean;
};

export function AstroProfileForm({ initial }: { initial: F }) {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const { toast } = useApp();
  const router = useRouter();
  const set = <K extends keyof F>(k: K, v: F[K]) => setF((x) => ({ ...x, [k]: v }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await fetch('/api/astrologer/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return toast(j.error, 'error');
    toast('Profile updated', 'success');
    router.refresh();
  };

  const modes = [
    { k: 'Chat', on: 'isChat', price: 'chatPrice', icon: MessageCircle },
    { k: 'Voice call', on: 'isCall', price: 'callPrice', icon: Phone },
    { k: 'Video call', on: 'isVideo', price: 'videoPrice', icon: Video },
  ] as const;

  return (
    <form onSubmit={save} className="mt-6 space-y-6">
      <div className="card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Display name</label><input className="input" value={f.displayName} onChange={(e) => set('displayName', e.target.value)} required minLength={3} /></div>
        <div><label className="label">Skills (comma separated)</label><input className="input" value={f.skills} onChange={(e) => set('skills', e.target.value)} /></div>
        <div><label className="label">Languages (comma separated)</label><input className="input" value={f.languages} onChange={(e) => set('languages', e.target.value)} /></div>
        <div><label className="label">Experience (years)</label><input type="number" min={0} max={70} className="input" value={f.experience} onChange={(e) => set('experience', Number(e.target.value))} /></div>
        <div><label className="label">City</label><input className="input" value={f.city} onChange={(e) => set('city', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">Qualification</label><input className="input" value={f.qualification} onChange={(e) => set('qualification', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">About you</label><textarea rows={5} className="input" value={f.bio} onChange={(e) => set('bio', e.target.value)} maxLength={1500} /></div>
      </div>
      <div className="card p-5">
        <h2 className="font-semibold">Consultation modes & price per minute</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {modes.map(({ k, on, price, icon: I }) => (
            <div key={k} className={cx('rounded-2xl p-4 ring-1 transition', f[on] ? 'bg-saffron-50 ring-saffron-200' : 'bg-cream-100 ring-line opacity-70')}>
              <label className="flex cursor-pointer items-center justify-between text-sm font-semibold">
                <span className="flex items-center gap-2"><I className="h-4 w-4" /> {k}</span>
                <input type="checkbox" checked={f[on]} onChange={(e) => set(on, e.target.checked)} className="h-4 w-4 accent-saffron-500" />
              </label>
              <div className="mt-3 flex items-center overflow-hidden rounded-xl bg-white ring-1 ring-line">
                <span className="px-3 text-sm text-muted">₹</span>
                <input type="number" min={5} max={1000} disabled={!f[on]} value={f[price]} onChange={(e) => set(price, Number(e.target.value))} className="min-w-0 flex-1 py-2 text-sm font-semibold outline-none" aria-label={`${k} price per minute`} />
                <span className="px-3 text-xs text-muted">/min</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button className="btn-primary btn-lg" disabled={busy}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save profile'}</button>
    </form>
  );
}
