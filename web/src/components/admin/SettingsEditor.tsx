'use client';

import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useAdminCall } from './client';

const KNOWN: Record<string, { label: string; hint?: string; multiline?: boolean }> = {
  contact_address: { label: 'Contact address', multiline: true },
  contact_email: { label: 'Contact email' },
  gst_percent: { label: 'GST % on recharges', hint: 'Applied on top of wallet recharge amounts.' },
  social: { label: 'Social links (JSON)', hint: '{"facebook": "…", "x": "…", "instagram": "…"}', multiline: true },
};

export function SettingsEditor({ rows }: { rows: { key: string; value: string }[] }) {
  const { call, busy } = useAdminCall();
  const [vals, setVals] = useState(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  const save = async (key: string, value: string) => {
    setSaving(key);
    await call('/api/admin/settings', 'PUT', { key, value }, 'Setting saved');
    setSaving(null);
  };

  return (
    <div className="space-y-4">
      {rows.map((r) => {
        const meta = KNOWN[r.key];
        return (
          <div key={r.key} className="card p-4">
            <div className="flex items-center justify-between gap-2">
              <label className="label !mb-0" htmlFor={`s-${r.key}`}>{meta?.label || r.key}</label>
              {!meta && (
                <button type="button" className="text-rose" aria-label={`Delete ${r.key}`} disabled={busy} onClick={() => confirm(`Delete setting "${r.key}"?`) && call(`/api/admin/settings?key=${encodeURIComponent(r.key)}`, 'DELETE', undefined, 'Setting deleted')}>
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="mt-2 flex items-start gap-2">
              {meta?.multiline ? (
                <textarea id={`s-${r.key}`} className="input min-h-20 font-mono text-xs" value={vals[r.key] ?? ''} onChange={(e) => setVals({ ...vals, [r.key]: e.target.value })} />
              ) : (
                <input id={`s-${r.key}`} className="input" value={vals[r.key] ?? ''} onChange={(e) => setVals({ ...vals, [r.key]: e.target.value })} />
              )}
              <button type="button" className="btn-dark btn-sm shrink-0 !py-2.5" disabled={busy || vals[r.key] === r.value} onClick={() => save(r.key, vals[r.key])}>
                {saving === r.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
              </button>
            </div>
            {meta?.hint && <p className="mt-1 text-xs text-muted">{meta.hint}</p>}
          </div>
        );
      })}
      <form
        className="card flex flex-wrap items-end gap-2 border-dashed p-4"
        onSubmit={async (e) => { e.preventDefault(); if (await call('/api/admin/settings', 'PUT', { key: newKey, value: newVal }, 'Setting added')) { setNewKey(''); setNewVal(''); } }}
      >
        <div className="min-w-40 flex-1">
          <label className="label" htmlFor="s-new-key">New key</label>
          <input id="s-new-key" className="input font-mono" value={newKey} onChange={(e) => setNewKey(e.target.value.toLowerCase())} placeholder="support_phone" required />
        </div>
        <div className="min-w-40 flex-[2]">
          <label className="label" htmlFor="s-new-val">Value</label>
          <input id="s-new-val" className="input" value={newVal} onChange={(e) => setNewVal(e.target.value)} />
        </div>
        <button className="btn-primary btn-sm !py-2.5" disabled={busy}><Plus className="h-4 w-4" /> Add</button>
      </form>
    </div>
  );
}
