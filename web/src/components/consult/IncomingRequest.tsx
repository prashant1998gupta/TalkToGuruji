'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, MessageCircle, Phone, Video, X } from 'lucide-react';
import type { SocketAck } from './types';
import { useApp } from '@/components/providers/AppProvider';
import { Avatar } from '@/components/ui/primitives';

type Incoming = { id: string; type: 'CHAT' | 'CALL' | 'VIDEO'; ratePerMin: number; user: { name: string }; intake: Record<string, string> | null };

/** Global popup (any page) that rings an astrologer when a user requests a consultation. */
export function IncomingRequest() {
  const { user, getSocket, toast } = useApp();
  const router = useRouter();
  const [queue, setQueue] = useState<Incoming[]>([]);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (user?.role !== 'ASTROLOGER') return;
    let off = () => {};
    getSocket().then((s) => {
      const onIn = (r: Incoming) => setQueue((q) => (q.some((x) => x.id === r.id) ? q : [...q, r]));
      const onEnd = (r: { id: string }) => setQueue((q) => q.filter((x) => x.id !== r.id));
      const onStart = (r: { id: string }) => { setQueue((q) => q.filter((x) => x.id !== r.id)); if (!location.pathname.startsWith(`/consult/${r.id}`)) window.location.assign(`/consult/${r.id}`); };
      s.on('consult:incoming', onIn);
      s.on('consult:ended', onEnd);
      s.on('consult:started', onStart);
      off = () => { s.off('consult:incoming', onIn); s.off('consult:ended', onEnd); s.off('consult:started', onStart); };
    });
    return () => off();
  }, [user?.role, getSocket, router]);

  // Soft chime while a request is waiting (WebAudio, no asset needed)
  useEffect(() => {
    if (!queue.length) return;
    const ring = () => {
      try {
        audio.current ??= new AudioContext();
        const ctx = audio.current;
        [0, 0.18].forEach((d, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = i ? 880 : 660;
          g.gain.setValueAtTime(0.0001, ctx.currentTime + d);
          g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + d + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d + 0.35);
          o.connect(g).connect(ctx.destination);
          o.start(ctx.currentTime + d);
          o.stop(ctx.currentTime + d + 0.4);
        });
      } catch {}
    };
    ring();
    const t = setInterval(ring, 2500);
    return () => clearInterval(t);
  }, [queue.length]);

  if (!queue.length) return null;
  const r = queue[0];
  const I = r.type === 'CHAT' ? MessageCircle : r.type === 'CALL' ? Phone : Video;

  const act = async (accept: boolean) => {
    const s = await getSocket();
    s.emit(accept ? 'consult:accept' : 'consult:reject', { sessionId: r.id }, (res: SocketAck) => {
      if (res?.error) toast(res.error, 'error');
      setQueue((q) => q.filter((x) => x.id !== r.id));
    });
  };

  return (
    <div className="fixed inset-x-3 bottom-24 z-[90] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]" role="alertdialog" aria-label="Incoming consultation request">
      <div className="night animate-fade-up overflow-hidden rounded-3xl p-5 shadow-2xl ring-1 ring-gold-400/30">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-gold-300"><I className="h-4 w-4" /> Incoming {r.type.toLowerCase()} request</p>
        <div className="mt-4 flex items-center gap-3">
          <Avatar name={r.user.name} size={52} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{r.user.name}</p>
            <p className="text-xs text-white/60">₹{r.ratePerMin / 100}/min{queue.length > 1 ? ` · ${queue.length - 1} more waiting` : ''}</p>
          </div>
        </div>
        {r.intake && (
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-2xl bg-white/5 p-3 text-xs">
            {[['DOB', r.intake.dob], ['Time', r.intake.tob || '—'], ['Place', r.intake.place], ['Concern', r.intake.concern]].map(([k, v]) => (
              <div key={k}><dt className="text-white/45">{k}</dt><dd className="truncate font-medium">{v}</dd></div>
            ))}
          </dl>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => act(false)} className="btn border border-white/15 bg-white/5 text-white hover:bg-white/10"><X className="h-4 w-4" /> Decline</button>
          <button type="button" onClick={() => act(true)} className="btn bg-leaf text-white hover:brightness-110"><Check className="h-4 w-4" /> Accept</button>
        </div>
      </div>
    </div>
  );
}
