'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookmarkPlus, Check, Loader2, Printer, Trash2 } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';

export function SaveKundliButton({ input }: { input: { name: string; gender: string; date: string; time: string; city: string } }) {
  const { user, toast } = useApp();
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const save = async () => {
    if (!user) return router.push(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
    setState('busy');
    const r = await fetch('/api/kundli', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input) });
    const j = await r.json();
    if (!r.ok) { setState('idle'); return toast(j.error, 'error'); }
    setState('done');
    toast('Kundli saved to your account', 'success');
    router.push(`/kundli/${j.id}`);
  };
  return (
    <button type="button" onClick={save} disabled={state !== 'idle'} className="btn-gold">
      {state === 'busy' ? <Loader2 className="h-4 w-4 animate-spin" /> : state === 'done' ? <Check className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
      {state === 'done' ? 'Saved' : 'Save kundli'}
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn border border-white/20 bg-white/5 text-white hover:bg-white/10">
      <Printer className="h-4 w-4" /> Print / PDF
    </button>
  );
}

export function DeleteKundliButton({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useApp();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      aria-label="Delete saved kundli"
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        if (!confirm('Delete this saved kundli?')) return;
        setBusy(true);
        const r = await fetch(`/api/kundli/${id}`, { method: 'DELETE' });
        setBusy(false);
        if (r.ok) { toast('Kundli deleted', 'success'); router.refresh(); } else toast('Could not delete', 'error');
      }}
      className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-rose/10 hover:text-rose"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
