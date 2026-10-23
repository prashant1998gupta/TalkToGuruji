'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Modal, useAdminCall } from './client';

export function BookingControls({ id, status, liveLink, astrologerId, astrologers }: { id: string; status: string; liveLink: string; astrologerId: string; astrologers: { id: string; displayName: string }[] }) {
  const [open, setOpen] = useState(false);
  const { call, busy } = useAdminCall();
  const [v, setV] = useState({ status, liveLink, astrologerId });
  if (status === 'CANCELLED') return <span className="text-xs text-muted">—</span>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.status === 'CANCELLED' && status !== 'CANCELLED' && !confirm(status === 'PENDING_PAYMENT' ? 'Cancel this unpaid booking?' : 'Cancel this booking and refund the amount to the user’s wallet?')) return;
    const r = await call(`/api/admin/bookings/${id}`, 'PATCH', { status: v.status, liveLink: v.liveLink, astrologerId: v.astrologerId || null }, 'Booking updated');
    if (r) setOpen(false);
  };

  return (
    <>
      <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(true)}><Settings2 className="h-3.5 w-3.5" /> Manage</button>
      {open && (
        <Modal title="Manage booking" onClose={() => setOpen(false)} size="sm">
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label" htmlFor="b-status">Status</label>
              <select id="b-status" className="input" value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
                {status === 'PENDING_PAYMENT' && <option value="PENDING_PAYMENT">Pending payment</option>}
                {status === 'PENDING_PAYMENT' && <option value="CONFIRMED">Confirmed (payment received offline)</option>}
                {status !== 'PENDING_PAYMENT' && <option value="CONFIRMED">Confirmed — to perform</option>}
                {status !== 'PENDING_PAYMENT' && <option value="COMPLETED">Completed</option>}
                <option value="CANCELLED">Cancelled{status !== 'PENDING_PAYMENT' ? ' (refund to wallet)' : ''}</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b-astro">Pandit / astrologer</label>
              <select id="b-astro" className="input" value={v.astrologerId} onChange={(e) => setV({ ...v, astrologerId: e.target.value })}>
                <option value="">Not assigned</option>
                {astrologers.map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b-link">Live stream link</label>
              <input id="b-link" className="input" type="url" value={v.liveLink} onChange={(e) => setV({ ...v, liveLink: e.target.value })} placeholder="https://youtube.com/live/…" />
              <p className="mt-1 text-xs text-muted">The devotee sees this link in their bookings and gets a notification.</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost btn-sm" onClick={() => setOpen(false)}>Close</button>
              <button className="btn-primary btn-sm" disabled={busy}>Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
