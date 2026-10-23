'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/providers/AppProvider';

export type AstroStatus = { isOnline: boolean; isBusy: boolean };

/** Live online/busy map for a set of astrologers, seeded from server data. */
export function useAstroStatuses(initial: Record<string, AstroStatus>) {
  const { getSocket } = useApp();
  const [map, setMap] = useState(initial);
  useEffect(() => {
    let off = () => {};
    getSocket().then((s) => {
      const on = (a: { id: string } & AstroStatus) => setMap((m) => (a.id in m ? { ...m, [a.id]: { isOnline: a.isOnline, isBusy: a.isBusy } } : m));
      s.on('astro:status', on);
      off = () => s.off('astro:status', on);
    });
    return () => off();
  }, [getSocket]);
  return map;
}
