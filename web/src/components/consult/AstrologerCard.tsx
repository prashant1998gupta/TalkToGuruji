'use client';

import Link from 'next/link';
import { BadgeCheck, MessageCircle, Phone, Video } from 'lucide-react';
import { Avatar, Stars } from '@/components/ui/primitives';
import { useConsultLauncher, type ConsultType } from './ConsultLauncher';
import { cx, rupees, splitList } from '@/lib/format';

export type AstroCardData = {
  id: string; slug: string; displayName: string; avatar: string | null; skills: string; languages: string; experience: number;
  chatPrice: number; callPrice: number; videoPrice: number; isChat: boolean; isCall: boolean; isVideo: boolean;
  rating: number; ratingCount: number; totalMinutes: number; freeMinutes: number; featured?: boolean;
};

export function AstrologerCard({ a, status, mode = 'CHAT', layout = 'row' }: { a: AstroCardData; status: { isOnline: boolean; isBusy: boolean }; mode?: ConsultType; layout?: 'row' | 'tile' }) {
  const { launch } = useConsultLauncher();
  const available = status.isOnline && !status.isBusy;
  const statusText = status.isBusy ? 'Busy' : status.isOnline ? 'Online' : 'Offline';
  const price = mode === 'CHAT' ? a.chatPrice : mode === 'CALL' ? a.callPrice : a.videoPrice;
  const enabled = mode === 'CHAT' ? a.isChat : mode === 'CALL' ? a.isCall : a.isVideo;
  const ModeIcon = mode === 'CHAT' ? MessageCircle : mode === 'CALL' ? Phone : Video;

  const actions = (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => launch(a, mode)}
      className={cx('btn btn-sm w-full sm:w-auto', available ? 'bg-leaf text-white hover:brightness-110' : status.isBusy ? 'border border-saffron-300 bg-saffron-50 text-saffron-700' : 'border border-line bg-white text-muted')}
      title={available ? undefined : status.isBusy ? 'Astrologer is in another consultation' : 'Astrologer is offline'}
    >
      <ModeIcon className="h-3.5 w-3.5" /> {mode === 'CHAT' ? 'Chat' : mode === 'CALL' ? 'Call' : 'Video'}
    </button>
  );

  if (layout === 'tile') {
    return (
      <div className="card-hover flex w-[230px] shrink-0 flex-col items-center p-5 text-center">
        <Link href={`/astrologer/${a.slug}`} className="flex flex-col items-center">
          <Avatar name={a.displayName} src={a.avatar} size={76} online={status.isOnline && !status.isBusy} />
          <p className="mt-3 line-clamp-1 font-semibold text-night-900">{a.displayName}</p>
        </Link>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{splitList(a.skills).slice(0, 2).join(' · ')}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs"><Stars value={a.rating} size={12} /><span className="text-muted">({a.ratingCount})</span></div>
        <p className="mt-3 text-sm"><b>{rupees(price)}</b><span className="text-muted">/min</span></p>
        <div className="mt-3 w-full">{actions}</div>
      </div>
    );
  }

  return (
    <article className="card-hover flex gap-4 p-4">
      <Link href={`/astrologer/${a.slug}`} className="flex shrink-0 flex-col items-center gap-2">
        <Avatar name={a.displayName} src={a.avatar} size={72} online={status.isOnline && !status.isBusy} />
        <span className="flex items-center gap-1 text-[11px]"><Stars value={a.rating} size={10} /></span>
        <span className="text-[10.5px] text-muted">{a.ratingCount} reviews</span>
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/astrologer/${a.slug}`} className="min-w-0">
            <h3 className="flex items-center gap-1 truncate font-semibold text-night-900 hover:text-saffron-700">
              {a.displayName} <BadgeCheck className="h-4 w-4 shrink-0 fill-saffron-500 text-white" />
            </h3>
          </Link>
          <span className={cx('shrink-0 text-[11px] font-bold', status.isBusy ? 'text-saffron-600' : status.isOnline ? 'text-leaf' : 'text-muted')}>{statusText}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-ink/70">{splitList(a.skills).join(', ')}</p>
        <p className="truncate text-xs text-muted">{splitList(a.languages).join(', ')}</p>
        <p className="text-xs text-muted">Exp: {a.experience} years · {Math.round(a.totalMinutes / 1000)}k mins</p>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            {a.freeMinutes > 0 && <span className="mr-1.5 rounded bg-leaf/10 px-1.5 py-0.5 text-[10px] font-bold text-leaf">FREE {a.freeMinutes} MIN</span>}
            <b>{rupees(price)}</b><span className="text-xs text-muted">/min</span>
          </p>
          {actions}
        </div>
      </div>
    </article>
  );
}
