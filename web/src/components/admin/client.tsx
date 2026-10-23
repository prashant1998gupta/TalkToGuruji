'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { useApp } from '@/components/providers/AppProvider';
import { cx } from '@/lib/format';

/** fetch JSON → toast → refresh server data. Returns the parsed JSON or null on failure. */
export function useAdminCall() {
  const { toast } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const call = async (url: string, method: string, payload?: unknown, success?: string) => {
    setBusy(true);
    try {
      const r = await fetch(url, { method, headers: payload ? { 'content-type': 'application/json' } : undefined, body: payload ? JSON.stringify(payload) : undefined });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { toast(j.error || `Request failed (${r.status})`, 'error'); return null; }
      if (success) toast(success, 'success');
      router.refresh();
      return j;
    } catch {
      toast('Network error — is the server running?', 'error');
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { call, busy };
}

/** Button that performs an admin API call, optionally behind a confirm dialog. */
export function ActionButton({ url, method = 'PATCH', payload, confirm, success, children, className = 'btn-ghost btn-sm', danger }: {
  url: string; method?: string; payload?: unknown; confirm?: string; success?: string; children: React.ReactNode; className?: string; danger?: boolean;
}) {
  const { call, busy } = useAdminCall();
  const [ask, setAsk] = useState(false);
  const run = () => call(url, method, payload, success).then(() => setAsk(false));
  return (
    <>
      <button type="button" disabled={busy} onClick={() => (confirm ? setAsk(true) : run())} className={cx(className, danger && '!text-rose hover:!border-rose/40')}>
        {busy && !confirm ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : children}
      </button>
      {ask && (
        <Modal title="Are you sure?" onClose={() => setAsk(false)} size="sm">
          <p className="text-sm text-ink/80">{confirm}</p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-ghost btn-sm" onClick={() => setAsk(false)}>Cancel</button>
            <button type="button" className={cx('btn btn-sm text-white', danger ? 'bg-rose hover:brightness-110' : 'bg-night-900 hover:bg-night-700')} disabled={busy} onClick={run}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function Modal({ title, onClose, children, size = 'md' }: { title: string; onClose: () => void; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center bg-night-950/55 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('max-h-[92dvh] w-full animate-fade-up overflow-y-auto rounded-t-3xl bg-white shadow-2xl [animation-duration:.2s] sm:rounded-3xl', size === 'sm' ? 'sm:max-w-md' : size === 'lg' ? 'sm:max-w-4xl' : 'sm:max-w-2xl')}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-5 py-3.5 backdrop-blur">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-cream-100" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
