'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';

type Slide = { src: string; title: string; caption: string };
const DURATION = 6000;

/** Full-screen, auto-advancing web story with tap zones and keyboard support. */
export function StoryViewer({ title, slides, next }: { title: string; slides: Slide[]; next?: { href: string; title: string } | null }) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const start = useRef(0);
  const elapsed = useRef(0);
  const done = i >= slides.length;

  const go = useCallback((n: number) => {
    elapsed.current = 0;
    setProgress(0);
    setI(Math.max(0, Math.min(slides.length, n)));
  }, [slides.length]);

  useEffect(() => {
    if (done || paused) return;
    start.current = performance.now() - elapsed.current;
    let raf = 0;
    const tick = (t: number) => {
      elapsed.current = t - start.current;
      const p = elapsed.current / DURATION;
      if (p >= 1) { go(i + 1); return; }
      setProgress(p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [i, paused, done, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(i + 1);
      else if (e.key === 'ArrowLeft') go(i - 1);
      else if (e.key === 'Escape') router.push('/web-stories');
      else if (e.key === ' ') { e.preventDefault(); setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [i, go, router]);

  const s = slides[Math.min(i, slides.length - 1)];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-night-950" role="dialog" aria-label={title}>
      {/* blurred backdrop */}
      <Image src={s.src} alt="" fill sizes="100vw" className="scale-110 object-cover opacity-30 blur-2xl" />
      <button type="button" onClick={() => go(i - 1)} className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 md:grid" aria-label="Previous"><ChevronLeft /></button>
      <button type="button" onClick={() => go(i + 1)} className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 md:grid" aria-label="Next"><ChevronRight /></button>

      <div className="relative h-full w-full overflow-hidden bg-night-900 md:h-[92dvh] md:w-auto md:max-w-[min(92vw,calc(92dvh*9/16))] md:rounded-3xl md:aspect-[9/16]">
        {/* progress bars */}
        <div className="absolute inset-x-3 top-3 z-20 flex gap-1">
          {slides.map((_, k) => (
            <span key={k} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span className="block h-full bg-white" style={{ width: `${k < i ? 100 : k === i ? progress * 100 : 0}%` }} />
            </span>
          ))}
        </div>
        <div className="absolute inset-x-3 top-6 z-20 flex items-center justify-between">
          <p className="line-clamp-1 pr-4 text-sm font-semibold text-white drop-shadow">{title}</p>
          <div className="flex gap-1">
            <button type="button" onClick={() => setPaused((p) => !p)} className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/15" aria-label={paused ? 'Play' : 'Pause'}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
            <Link href="/web-stories" className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/15" aria-label="Close"><X className="h-5 w-5" /></Link>
          </div>
        </div>

        {done ? (
          <div className="night flex h-full flex-col items-center justify-center p-8 text-center">
            <p className="eyebrow !text-gold-300">The end</p>
            <p className="h-display mt-3 text-3xl text-white">{title}</p>
            <div className="mt-8 grid w-full max-w-xs gap-2">
              <button type="button" onClick={() => go(0)} className="btn border border-white/20 bg-white/5 text-white">Watch again</button>
              {next && <Link href={next.href} className="btn-gold">Next: {next.title}</Link>}
              <Link href="/astrology-services/chat-with-astrologer" className="btn-ghost">Ask an astrologer</Link>
            </div>
          </div>
        ) : (
          <>
            <Image key={s.src} src={s.src} alt={s.title} fill priority sizes="(max-width:768px) 100vw, 520px" className="animate-fade-up object-cover [animation-duration:.5s]" />
            <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24 text-white">
              {s.title && <p className="font-display text-2xl font-semibold leading-tight">{s.title}</p>}
              {s.caption && <p className="mt-2 text-sm leading-relaxed text-white/85">{s.caption}</p>}
            </div>
            {/* tap zones */}
            <button type="button" className="absolute inset-y-0 left-0 z-[5] w-1/3" onClick={() => go(i - 1)} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} aria-label="Previous slide" />
            <button type="button" className="absolute inset-y-0 right-0 z-[5] w-2/3" onClick={() => go(i + 1)} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} aria-label="Next slide" />
          </>
        )}
      </div>
    </div>
  );
}
