'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Loader2 } from 'lucide-react';
import { HOROSCOPE_FIELDS } from './entities';
import { useAdminCall } from './client';
import { cx } from '@/lib/format';

type Data = Record<string, Record<string, string>>;
const LABELS: Record<string, string> = { personal: 'Personal / overview', profession: 'Career & profession', love: 'Love & relationships', luck: 'Luck & finance', health: 'Health', travel: 'Travel', emotions: 'Emotions' };

export function HoroscopeEditor({ date, signs, data, recent }: { date: string; signs: { slug: string; name: string; glyph: string }[]; data: Data; recent: { date: string; count: number }[] }) {
  const router = useRouter();
  const { call, busy } = useAdminCall();
  const [sign, setSign] = useState(signs[0].slug);
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm(Object.fromEntries(HOROSCOPE_FIELDS.map((f) => [f, data[sign]?.[f] || ''])));
  }, [sign, data]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await call('/api/admin/horoscope', 'PUT', { date, sign, data: form }, `${signs.find((s) => s.slug === sign)?.name} saved for ${date}`);
  };

  const openDate = (d: string) => router.push(`/admin/horoscope?date=${d}`);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <div className="space-y-4">
        <div className="card p-4">
          <label className="label" htmlFor="h-date">Date</label>
          <input id="h-date" type="date" className="input" value={date} onChange={(e) => router.push(`/admin/horoscope?date=${e.target.value}`)} />
          <p className="mt-2 text-xs text-muted">{Object.keys(data).length}/12 signs published for this date.</p>
        </div>
        <div className="card p-2">
          {signs.map((s) => (
            <button key={s.slug} type="button" onClick={() => setSign(s.slug)} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium', sign === s.slug ? 'bg-night-900 text-white' : 'hover:bg-cream-100')}>
              <span className={cx('w-6 text-center text-lg', sign === s.slug ? 'text-gold-300' : 'text-saffron-600')}>{s.glyph}</span>
              <span className="flex-1">{s.name}</span>
              {data[s.slug] && <Check className={cx('h-4 w-4', sign === s.slug ? 'text-gold-300' : 'text-leaf')} />}
            </button>
          ))}
        </div>
        {!!recent.length && (
          <div className="card p-4">
            <p className="label">Recent dates</p>
            <ul className="space-y-1 text-sm">
              {recent.map((r) => (
                <li key={r.date}>
                  <button type="button" onClick={() => openDate(r.date)} className={cx('flex w-full justify-between rounded-lg px-2 py-1 hover:bg-cream-100', r.date === date && 'font-bold text-saffron-700')}>
                    {r.date} <span className="text-muted">{r.count}/12</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <form onSubmit={save} className="card space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">{signs.find((s) => s.slug === sign)?.name} · {date}</h2>
          {!data[sign] && Object.keys(data).length > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted"><Copy className="h-3.5 w-3.5" /> Not yet written for this sign</span>
          )}
        </div>
        {HOROSCOPE_FIELDS.map((f) => (
          <div key={f}>
            <label className="label" htmlFor={`h-${f}`}>{LABELS[f]}</label>
            <textarea id={`h-${f}`} className="input min-h-20" value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
          </div>
        ))}
        <div className="flex justify-end">
          <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Publish for this sign'}</button>
        </div>
      </form>
    </div>
  );
}
