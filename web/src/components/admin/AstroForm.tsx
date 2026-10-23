'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Pause, X } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { ActionButton } from './client';
import { ImageInput } from './EntityForm';

export type AstroFormValues = {
  phone?: string; displayName: string; slug: string; avatar: string; bio: string; skills: string; languages: string; experience: number | string;
  qualification: string; gender: string; city: string; chatPrice: number | string; callPrice: number | string; videoPrice: number | string;
  commission: number | string; freeMinutes: number | string; isChat: boolean; isCall: boolean; isVideo: boolean; featured: boolean;
};

export function AstroStatusActions({ id, status, compact }: { id: string; status: string; compact?: boolean }) {
  const url = `/api/admin/astrologers/${id}`;
  const cls = compact ? 'btn-ghost btn-sm' : 'btn-ghost';
  return (
    <>
      {status !== 'APPROVED' && (
        <ActionButton url={url} payload={{ action: 'approve' }} success="Astrologer approved" className={`${cls} !border-leaf/40 !text-leaf`}>
          <Check className="h-3.5 w-3.5" /> Approve
        </ActionButton>
      )}
      {status === 'PENDING' && (
        <ActionButton url={url} payload={{ action: 'reject' }} success="Application rejected" confirm="Reject this application? The applicant will be notified." danger className={cls}>
          <X className="h-3.5 w-3.5" /> Reject
        </ActionButton>
      )}
      {status === 'APPROVED' && !compact && (
        <ActionButton url={url} payload={{ action: 'suspend' }} success="Astrologer suspended" confirm="Suspended astrologers go offline immediately, disappear from the website and lose dashboard access." danger className={cls}>
          <Pause className="h-3.5 w-3.5" /> Suspend
        </ActionButton>
      )}
    </>
  );
}

export function AstroForm({ id, initial }: { id?: string; initial: AstroFormValues }) {
  const { toast } = useApp();
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof AstroFormValues>(k: K, val: AstroFormValues[K]) => setV((s) => ({ ...s, [k]: val }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const r = await fetch(id ? `/api/admin/astrologers/${id}` : '/api/admin/astrologers', { method: id ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(v) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return toast(j.error || 'Could not save.', 'error');
    toast(id ? 'Profile saved' : 'Astrologer created', 'success');
    if (!id) router.push(`/admin/astrologers/${j.id}`);
    router.refresh();
  };

  const text = (k: keyof AstroFormValues, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className="label" htmlFor={`a-${k}`}>{label}</label>
      <input id={`a-${k}`} className="input" value={String(v[k] ?? '')} onChange={(e) => set(k, e.target.value as never)} {...props} />
    </div>
  );
  const toggle = (k: 'isChat' | 'isCall' | 'isVideo' | 'featured', label: string) => (
    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-medium">
      <input type="checkbox" className="h-4 w-4 accent-saffron-500" checked={v[k]} onChange={(e) => set(k, e.target.checked)} /> {label}
    </label>
  );

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Profile</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {!id && text('phone', 'Login mobile number', { required: true, inputMode: 'numeric', maxLength: 10, placeholder: '10-digit mobile' })}
          {text('displayName', 'Display name', { required: true })}
          {id && text('slug', 'Profile URL slug')}
          {text('city', 'City')}
          <div>
            <label className="label" htmlFor="a-gender">Gender</label>
            <select id="a-gender" className="input" value={v.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">—</option><option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
          {text('experience', 'Experience (years)', { type: 'number', min: 0, max: 80 })}
          {text('qualification', 'Qualification')}
          {text('skills', 'Skills (comma separated)', { placeholder: 'Vedic, Tarot, Vastu' })}
          {text('languages', 'Languages (comma separated)', { placeholder: 'Hindi, English' })}
          <div className="md:col-span-2">
            <label className="label">Photo</label>
            <ImageInput value={v.avatar} onChange={(u) => set('avatar', u)} />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="a-bio">Bio</label>
            <textarea id="a-bio" className="input min-h-28" value={v.bio} onChange={(e) => set('bio', e.target.value)} />
          </div>
        </div>
      </div>
      <div className="card space-y-4 p-5">
        <h2 className="font-display text-lg font-semibold">Pricing & payout</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {text('chatPrice', 'Chat ₹/min', { type: 'number', min: 1, max: 1000, step: 1, required: true })}
          {text('callPrice', 'Call ₹/min', { type: 'number', min: 1, max: 1000, step: 1, required: true })}
          {text('videoPrice', 'Video ₹/min', { type: 'number', min: 1, max: 1000, step: 1, required: true })}
          {text('commission', 'Platform commission %', { type: 'number', min: 0, max: 90 })}
          {text('freeMinutes', 'Free minutes (first session)', { type: 'number', min: 0, max: 30 })}
        </div>
        <div className="flex flex-wrap gap-2">
          {toggle('isChat', 'Offers chat')}
          {toggle('isCall', 'Offers voice call')}
          {toggle('isVideo', 'Offers video call')}
          {toggle('featured', 'Featured on homepage')}
        </div>
        <p className="text-xs text-muted">Astrologer receives {100 - Number(v.commission || 0)}% of every billed minute.</p>
      </div>
      <div className="flex justify-end">
        <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : id ? 'Save changes' : 'Create astrologer'}</button>
      </div>
    </form>
  );
}
