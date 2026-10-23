'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/providers/AppProvider';
import { cx } from '@/lib/format';
import type { SocketAck } from './types';

/** Astrologer availability switch. Uses the socket so users see the change instantly. */
export function OnlineToggle({ astrologerId, initial, busy }: { astrologerId: string; initial: boolean; busy: boolean }) {
  const { getSocket, toast } = useApp();
  const [online, setOnline] = useState(initial);
  const [isBusy, setBusy] = useState(busy);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let off = () => {};
    getSocket().then((s) => {
      const on = (a: { id: string; isOnline: boolean; isBusy: boolean }) => { if (a.id === astrologerId) { setOnline(a.isOnline); setBusy(a.isBusy); } };
      s.on('astro:status', on);
      off = () => s.off('astro:status', on);
    });
    return () => off();
  }, [astrologerId, getSocket]);

  const toggle = async () => {
    setSaving(true);
    const s = await getSocket();
    s.emit('astro:set-online', { online: !online }, (res: SocketAck) => {
      setSaving(false);
      if (res?.error) return toast(res.error, 'error');
      setOnline(!!res.online);
      toast(res.online ? 'You are online — users can now reach you.' : 'You are offline.', 'success');
    });
  };

  return (
    <div className={cx('flex items-center gap-4 rounded-3xl p-5 ring-1 transition', online ? 'bg-leaf/10 ring-leaf/25' : 'bg-white ring-line')}>
      <div className="flex-1">
        <p className="font-semibold">{online ? (isBusy ? 'Online · in a consultation' : 'You are online') : 'You are offline'}</p>
        <p className="text-sm text-muted">{online ? 'Keep this tab open to receive chat, call and video requests.' : 'Go online to start receiving consultation requests.'}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={online}
        aria-label="Online status"
        onClick={toggle}
        disabled={saving}
        data-testid="online-toggle"
        className={cx('relative h-9 w-16 shrink-0 rounded-full transition disabled:opacity-60', online ? 'bg-leaf' : 'bg-cream-300')}
      >
        <span className={cx('absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all', online ? 'left-8' : 'left-1')} />
      </button>
    </div>
  );
}
