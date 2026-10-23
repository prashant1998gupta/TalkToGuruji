'use client';

import { MessageCircle, Phone, Video } from 'lucide-react';
import { useConsultLauncher, type ConsultType, type LaunchAstro } from './ConsultLauncher';
import { useAstroStatuses } from './useAstroStatus';
import { cx, rupees } from '@/lib/format';

type Props = { astro: LaunchAstro & { isChat: boolean; isCall: boolean; isVideo: boolean }; status: { isOnline: boolean; isBusy: boolean } };

/** Live status pill + chat/call/video launch buttons for the astrologer profile. */
export function ProfileActions({ astro, status }: Props) {
  const live = useAstroStatuses({ [astro.id]: status })[astro.id];
  const { launch } = useConsultLauncher();
  const available = live.isOnline && !live.isBusy;
  const modes: { t: ConsultType; label: string; icon: typeof Phone; price: number; on: boolean }[] = [
    { t: 'CHAT', label: 'Chat', icon: MessageCircle, price: astro.chatPrice, on: astro.isChat },
    { t: 'CALL', label: 'Call', icon: Phone, price: astro.callPrice, on: astro.isCall },
    { t: 'VIDEO', label: 'Video', icon: Video, price: astro.videoPrice, on: astro.isVideo },
  ];
  return (
    <div>
      <p className={cx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold', available ? 'bg-leaf/15 text-leaf' : live.isBusy ? 'bg-saffron-400/20 text-saffron-300' : 'bg-white/10 text-white/60')}>
        <span className={cx('h-2 w-2 rounded-full', available ? 'animate-pulse-ring bg-leaf' : live.isBusy ? 'bg-saffron-400' : 'bg-white/40')} />
        {available ? 'Available now' : live.isBusy ? 'In a consultation — wait a few minutes' : 'Offline right now'}
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
        {modes.map(({ t, label, icon: I, price, on }) => (
          <button
            key={t}
            type="button"
            disabled={!on}
            onClick={() => launch(astro, t)}
            className={cx('flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-sm font-semibold transition disabled:opacity-35', available ? 'bg-leaf text-white hover:brightness-110' : 'bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/15')}
          >
            <I className="h-5 w-5" />
            {label}
            <span className="text-[11px] font-medium opacity-80">{on ? `${rupees(price)}/min` : 'Not offered'}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
