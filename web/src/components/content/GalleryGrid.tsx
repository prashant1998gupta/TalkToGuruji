'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type Photo = { src: string; title: string; caption: string };

/** Masonry photo grid with a keyboard-navigable lightbox. */
export function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((o) => (o === null ? o : (o + 1) % photos.length));
      if (e.key === 'ArrowLeft') setOpen((o) => (o === null ? o : (o - 1 + photos.length) % photos.length));
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, photos.length]);

  return (
    <>
      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {photos.map((p, i) => (
          <figure key={i} className="card group break-inside-avoid overflow-hidden">
            <button type="button" onClick={() => setOpen(i)} className="relative block w-full overflow-hidden" aria-label={`Open photo: ${p.title || i + 1}`}>
              <Image src={p.src} alt={p.title} width={800} height={600} sizes="(max-width:640px) 100vw, 33vw" className="h-auto w-full transition duration-700 group-hover:scale-[1.03]" />
            </button>
            {(p.title || p.caption) && (
              <figcaption className="p-4">
                {p.title && <p className="font-display text-lg font-semibold text-night-900">{p.title}</p>}
                {p.caption && <p className="mt-1 text-sm leading-relaxed text-muted">{p.caption}</p>}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-[80] flex flex-col bg-night-950/95 backdrop-blur" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="flex items-center justify-between p-4 text-white">
            <p className="text-sm text-white/60">{open + 1} / {photos.length}</p>
            <button type="button" onClick={() => setOpen(null)} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close"><X className="h-5 w-5" /></button>
          </div>
          <div className="relative flex-1">
            <Image key={open} src={photos[open].src} alt={photos[open].title} fill sizes="100vw" className="animate-fade-up object-contain [animation-duration:.3s]" />
            <button type="button" onClick={() => setOpen((open - 1 + photos.length) % photos.length)} className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous photo"><ChevronLeft /></button>
            <button type="button" onClick={() => setOpen((open + 1) % photos.length)} className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next photo"><ChevronRight /></button>
          </div>
          <div className="mx-auto max-w-2xl p-5 text-center text-white">
            <p className="font-display text-xl font-semibold">{photos[open].title}</p>
            <p className="mt-1 text-sm text-white/65">{photos[open].caption}</p>
          </div>
        </div>
      )}
    </>
  );
}
