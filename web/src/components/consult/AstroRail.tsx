'use client';

import { AstrologerCard, type AstroCardData } from './AstrologerCard';
import { useAstroStatuses, type AstroStatus } from './useAstroStatus';

/** Horizontal rail of astrologer tiles with live presence. */
export function AstroRail({ astrologers, statuses }: { astrologers: AstroCardData[]; statuses: Record<string, AstroStatus> }) {
  const live = useAstroStatuses(statuses);
  const sorted = [...astrologers].sort((a, b) => score(live[b.id]) - score(live[a.id]));
  return (
    <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {sorted.map((a) => (
        <div key={a.id} className="snap-start">
          <AstrologerCard a={a} status={live[a.id]} layout="tile" />
        </div>
      ))}
    </div>
  );
}

const score = (s?: AstroStatus) => (!s ? 0 : s.isOnline && !s.isBusy ? 2 : s.isOnline ? 1 : 0);
