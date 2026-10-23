'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Socket } from 'socket.io-client';

export type SessionUser = {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  role: 'USER' | 'ASTROLOGER' | 'ADMIN';
  walletBalance: number;
  astrologer: { id: string; slug: string; displayName: string; status: string; isOnline: boolean } | null;
  unread: number;
};

type Toast = { id: number; kind: 'success' | 'error' | 'info'; text: string };

type Ctx = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setBalance: (paise: number) => void;
  getSocket: () => Promise<Socket>;
  toast: (text: string, kind?: Toast['kind']) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be used inside <AppProvider>');
  return c;
}

let socketPromise: Promise<Socket> | null = null;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/me', { cache: 'no-store' });
      const j = await r.json();
      setUser(j.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const getSocket = useCallback(() => {
    // Socket.io client is loaded on demand so pages that never need realtime don't pay for it.
    if (!socketPromise) {
      socketPromise = import('socket.io-client').then(({ io }) => io({ path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'] }));
    }
    return socketPromise;
  }, []);

  // Reconnect with fresh cookie after login/logout so the server sees the right identity.
  const lastUserId = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (loading) return;
    const id = user?.id ?? null;
    if (lastUserId.current !== undefined && lastUserId.current !== id && socketPromise) {
      socketPromise.then((s) => { s.disconnect(); s.connect(); });
    }
    lastUserId.current = id;
    if (id) getSocket(); // signed-in users stay connected for notifications & live balance
  }, [user?.id, loading, getSocket]);

  useEffect(() => {
    if (!user) return;
    let off = () => {};
    getSocket().then((s) => {
      const onTick = (p: { balance?: number }) => typeof p.balance === 'number' && setUser((u) => (u ? { ...u, walletBalance: p.balance! } : u));
      const onBal = (p: { balance: number }) => setUser((u) => (u ? { ...u, walletBalance: p.balance } : u));
      s.on('consult:tick', onTick);
      s.on('wallet:balance', onBal);
      off = () => { s.off('consult:tick', onTick); s.off('wallet:balance', onBal); };
    });
    return () => off();
  }, [user?.id, getSocket]); // eslint-disable-line react-hooks/exhaustive-deps

  const toast = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const setBalance = useCallback((paise: number) => setUser((u) => (u ? { ...u, walletBalance: paise } : u)), []);

  const value = useMemo(() => ({ user, loading, refresh, setBalance, getSocket, toast }), [user, loading, refresh, setBalance, getSocket, toast]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-fade-up rounded-full px-4 py-2.5 text-sm font-medium shadow-lift ${
              t.kind === 'error' ? 'bg-rose text-white' : t.kind === 'success' ? 'bg-night-900 text-white' : 'bg-white text-ink ring-1 ring-line'
            }`}
          >
            {t.kind === 'success' ? '✓ ' : ''}
            {t.text}
          </div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
