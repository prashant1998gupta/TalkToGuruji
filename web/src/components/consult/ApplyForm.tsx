'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { cx } from '@/lib/format';

const SKILLS = ['Vedic', 'KP System', 'Prashna', 'Lal Kitab', 'Nadi', 'Tarot', 'Numerology', 'Palmistry', 'Face Reading', 'Vastu', 'Muhurta', 'Kundli Matching', 'Gemstones', 'Puja Vidhi'];
const LANGS = ['Hindi', 'English', 'Punjabi', 'Bengali', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Odia', 'Sanskrit'];

export function ApplyForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const router = useRouter();
  const { toast, refresh } = useApp();
  const [f, setF] = useState({ displayName: defaultName, email: defaultEmail, gender: 'Male', city: '', experience: 5, qualification: '', bio: '', chatPrice: 20 });
  const [skills, setSkills] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>(['Hindi']);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!skills.length) return setErr('Pick at least one speciality.');
    if (!langs.length) return setErr('Pick at least one language.');
    setBusy(true);
    const r = await fetch('/api/astrologer/apply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...f, skills, languages: langs }) });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error);
    toast('Application submitted!', 'success');
    await refresh();
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 sm:p-7">
      <h2 className="font-display text-2xl font-semibold">Your astrologer profile</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><label className="label">Display name</label><input required minLength={3} className="input" value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} placeholder="e.g. Acharya Ramesh Sharma" /></div>
        <div><label className="label">Email</label><input type="email" className="input" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Gender</label><select className="input" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div><label className="label">City</label><input required className="input" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        <div><label className="label">Experience (years)</label><input type="number" min={0} max={70} required className="input" value={f.experience} onChange={(e) => setF({ ...f, experience: Number(e.target.value) })} /></div>
        <div><label className="label">Qualification</label><input className="input" value={f.qualification} onChange={(e) => setF({ ...f, qualification: e.target.value })} placeholder="e.g. Jyotish Acharya" /></div>
        <div><label className="label">Chat price (₹/min)</label><input type="number" min={5} max={1000} required className="input" value={f.chatPrice} onChange={(e) => setF({ ...f, chatPrice: Number(e.target.value) })} /></div>
      </div>
      <Chips label="Specialities" all={SKILLS} sel={skills} onToggle={(v) => toggle(skills, setSkills, v)} />
      <Chips label="Languages" all={LANGS} sel={langs} onToggle={(v) => toggle(langs, setLangs, v)} />
      <div><label className="label">About you (min 30 characters)</label><textarea required minLength={30} rows={5} className="input" value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Your training, lineage, approach and what seekers can expect." /></div>
      {err && <p className="text-sm text-rose">{err}</p>}
      <button className="btn-primary btn-lg w-full" disabled={busy}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit application'}</button>
    </form>
  );
}

function Chips({ label, all, sel, onToggle }: { label: string; all: string[]; sel: string[]; onToggle: (v: string) => void }) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2">
        {all.map((v) => (
          <button key={v} type="button" onClick={() => onToggle(v)} aria-pressed={sel.includes(v)} className={cx('rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition', sel.includes(v) ? 'bg-night-900 text-white ring-night-900' : 'bg-white ring-line hover:ring-saffron-300')}>{v}</button>
        ))}
      </div>
    </div>
  );
}
