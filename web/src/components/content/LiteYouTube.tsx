'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Play } from 'lucide-react';


/** Shows a poster until clicked, then swaps in the (privacy-enhanced) YouTube player. */
export function LiteYouTube({ id, title, poster }: { id: string; title: string; poster?: string | null }) {
  const [play, setPlay] = useState(false);
  return (
    <div className="relative aspect-video overflow-hidden rounded-3xl bg-night-900 shadow-lift">
      {play ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0" aria-label={`Play video: ${title}`}>
          <Image src={poster || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" fill priority sizes="(max-width:1024px) 100vw, 60vw" className="object-cover opacity-90 transition group-hover:opacity-75" />
          <span className="absolute inset-0 bg-gradient-to-t from-night-950/70 via-transparent" />
          <span className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-saffron-500 text-white shadow-glow transition group-hover:scale-110">
            <Play className="ml-1 h-8 w-8 fill-white" />
          </span>
        </button>
      )}
    </div>
  );
}
