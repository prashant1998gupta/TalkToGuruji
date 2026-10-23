'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle, Phone, Video, X, Wallet } from 'lucide-react';
import type { SocketAck } from './types';
import { useApp } from '@/components/providers/AppProvider';
import { Avatar } from '@/components/ui/primitives';
import { rupees } from '@/lib/format';

export type ConsultType = 'CHAT' | 'CALL' | 'VIDEO';
export type LaunchAstro = { id: string; displayName: string; avatar?: string | null; chatPrice: number; callPrice: number; videoPrice: number; freeMinutes?: number };

type Ctx = { launch: (a: LaunchAstro, type: ConsultType) => void };
const LaunchCtx = createContext<Ctx | null>(null);
export const useConsultLauncher = () => {
  const c = useContext(LaunchCtx);
  if (!c) throw new Error('Wrap with <ConsultLauncherProvider>');
  return c;
};

const TYPE_META = {
  CHAT: { label: 'Chat', icon: MessageCircle },
  CALL: { label: 'Voice call', icon: Phone },
  VIDEO: { label: 'Video call', icon: Video },
};

/**
 * Owns the "start a consultation" flow: login gate → intake form → request →
 * waiting for the astrologer → redirect into the consultation room.
 */
export function ConsultLauncherProvider({ children }: { children: React.ReactNode }) {
  const { user, getSocket, toast } = useApp();
  const router = useRouter();
  const [target, setTarget] = useState<{ a: LaunchAstro; type: ConsultType } | null>(null);

  const launch = useCallback(
    (a: LaunchAstro, type: ConsultType) => {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (user.role !== 'USER') {
        toast('Consultations can be started from a user account.', 'error');
        return;
      }
      setTarget({ a, type });
    },
    [user, router, toast],
  );

  return (
    <LaunchCtx.Provider value={{ launch }}>
      {children}
      {target && <LaunchDialog key={target.a.id + target.type} astro={target.a} type={target.type} onClose={() => setTarget(null)} getSocket={getSocket} />}
    </LaunchCtx.Provider>
  );
}

function LaunchDialog({ astro, type, onClose, getSocket }: { astro: LaunchAstro; type: ConsultType; onClose: () => void; getSocket: ReturnType<typeof useApp>['getSocket'] }) {
  const { user, toast } = useApp();
  const router = useRouter();
  const [stage, setStage] = useState<'intake' | 'waiting' | 'lowbalance'>('intake');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [left, setLeft] = useState(60);
  const [need, setNeed] = useState(0);
  const [form, setForm] = useState({ name: user?.name || '', gender: 'Male', dob: '', tob: '', place: '', concern: 'Career' });
  const sessionRef = useRef<string | null>(null);

  const rate = type === 'CHAT' ? astro.chatPrice : type === 'CALL' ? astro.callPrice : astro.videoPrice;
  const M = TYPE_META[type];

  // Prefill intake from the user's saved profile
  useEffect(() => {
    fetch('/api/account/profile').then((r) => r.json()).then((j) => {
      if (j.profile) setForm((f) => ({ ...f, name: j.profile.name || f.name, gender: j.profile.gender || f.gender, dob: j.profile.birthDate || '', tob: j.profile.birthTime || '', place: j.profile.birthPlace || '' }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (stage !== 'waiting') return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(t);
  }, [stage]);

  // Subscribe once for the dialog's lifetime. Re-subscribing on every provider re-render
  // (e.g. a wallet balance push) left gaps where `consult:started` could be missed.
  const latest = useRef({ router, toast, onClose, name: astro.displayName });
  latest.current = { router, toast, onClose, name: astro.displayName };
  useEffect(() => {
    let off = () => {};
    let alive = true;
    getSocket().then((s) => {
      if (!alive) return;
      const started = (sess: { id: string }) => {
        if (sess.id !== sessionRef.current) return;
        // full navigation: entering the room must not depend on a client-side RSC fetch succeeding
        window.location.assign(`/consult/${sess.id}`);
        latest.current.onClose(); // the dialog lives in the root provider, so it must close itself
      };
      const ended = (sess: { id: string; status: string }) => {
        if (sess.id !== sessionRef.current) return;
        const { toast: t, name, onClose: close } = latest.current;
        t(sess.status === 'REJECTED' ? `${name} couldn’t take your request right now.` : sess.status === 'MISSED' ? `${name} didn’t respond. Please try another astrologer.` : 'Request closed.', 'error');
        close();
      };
      s.on('consult:started', started);
      s.on('consult:ended', ended);
      off = () => { s.off('consult:started', started); s.off('consult:ended', ended); };
    });
    return () => { alive = false; off(); };
  }, [getSocket]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    fetch('/api/account/profile', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.name, gender: form.gender, birthDate: form.dob, birthTime: form.tob, birthPlace: form.place }) }).catch(() => {});
    const s = await getSocket();
    s.emit('consult:request', { astrologerId: astro.id, type, intake: form }, (res: SocketAck) => {
      setBusy(false);
      if (res?.error === 'LOW_BALANCE') { setNeed(res.needed ?? 0); setStage('lowbalance'); return; }
      if (res?.error || !res.session) {
        if (res.sessionId) { router.push(`/consult/${res.sessionId}`); onClose(); return; }
        setErr(res.error || 'Something went wrong.');
        return;
      }
      sessionRef.current = res.session.id;
      setSessionId(res.session.id);
      setLeft(Math.round((res.timeoutMs ?? 60000) / 1000));
      setStage('waiting');
    });
  };

  const cancel = async () => {
    if (sessionId) (await getSocket()).emit('consult:cancel', { sessionId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-night-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="max-h-[92dvh] w-full max-w-lg animate-fade-up overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center gap-3 border-b border-line p-4">
          <Avatar name={astro.displayName} src={astro.avatar} size={44} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{astro.displayName}</p>
            <p className="flex items-center gap-1.5 text-xs text-muted"><M.icon className="h-3.5 w-3.5" /> {M.label} · {rupees(rate)}/min</p>
          </div>
          {stage !== 'waiting' && (
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream-100" aria-label="Close"><X className="h-5 w-5" /></button>
          )}
        </div>

        {stage === 'intake' && (
          <form onSubmit={submit} className="space-y-3.5 p-5">
            <p className="text-sm text-muted">Share your birth details so {astro.displayName.split(' ').slice(-1)[0]} can prepare your chart before connecting.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Name</label>
                <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="label">Gender</label>
                <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Date of birth</label>
                <input required type="date" className="input" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} max={new Date().toISOString().slice(0, 10)} />
              </div>
              <div>
                <label className="label">Time of birth</label>
                <input type="time" className="input" value={form.tob} onChange={(e) => setForm({ ...form, tob: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">Place of birth</label>
                <input required className="input" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} placeholder="e.g. Jaipur, Rajasthan" />
              </div>
              <div className="col-span-2">
                <label className="label">Main concern</label>
                <div className="flex flex-wrap gap-2">
                  {['Career', 'Marriage', 'Love', 'Health', 'Finance', 'Education', 'Other'].map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, concern: c })} className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${form.concern === c ? 'bg-night-900 text-white ring-night-900' : 'bg-white text-ink/75 ring-line hover:ring-saffron-300'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {!!astro.freeMinutes && <p className="rounded-xl bg-leaf/10 px-3 py-2 text-xs font-semibold text-leaf">First consultation? Your first {astro.freeMinutes} minutes are free.</p>}
            <p className="flex items-center gap-1.5 text-xs text-muted"><Wallet className="h-3.5 w-3.5" /> Wallet balance: <b className="text-ink">{rupees(user?.walletBalance || 0)}</b> · billed per minute, end anytime.</p>
            {err && <p className="text-sm text-rose">{err}</p>}
            <button className="btn-primary btn-lg w-full" disabled={busy}>
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Start {M.label.toLowerCase()} <M.icon className="h-4 w-4" /></>}
            </button>
          </form>
        )}

        {stage === 'waiting' && (
          <div className="flex flex-col items-center p-8 text-center">
            <div className="relative grid h-28 w-28 place-items-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-saffron-200 [animation-duration:2s]" />
              <Avatar name={astro.displayName} src={astro.avatar} size={96} />
            </div>
            <p className="mt-6 font-display text-xl font-semibold">Connecting you with {astro.displayName}</p>
            <p className="mt-1 text-sm text-muted">Waiting for the astrologer to accept… <b className="tabular-nums text-ink">{left}s</b></p>
            <div className="mt-5 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-cream-200">
              <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-saffron-500 transition-all duration-1000 ease-linear" style={{ width: `${(left / 60) * 100}%` }} />
            </div>
            <button type="button" onClick={cancel} className="btn-ghost mt-6">Cancel request</button>
          </div>
        )}

        {stage === 'lowbalance' && (
          <div className="p-6 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-saffron-50 text-saffron-600"><Wallet className="h-7 w-7" /></div>
            <p className="mt-4 font-display text-xl font-semibold">Recharge to continue</p>
            <p className="mt-1 text-sm text-muted">
              A minimum balance of <b className="text-ink">{rupees(need)}</b> (5 minutes) is needed to start with {astro.displayName}. Your balance is {rupees(user?.walletBalance || 0)}.
            </p>
            <button type="button" className="btn-primary btn-lg mt-6 w-full" onClick={() => router.push(`/wallet?need=${need}`)}>Recharge now</button>
          </div>
        )}
      </div>
    </div>
  );
}
