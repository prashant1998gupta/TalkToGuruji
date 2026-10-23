'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { LiveSky } from '@/lib/astro/sky';

// three.js (~150 kB gz) is split into its own chunk and only fetched on capable devices.
const CosmicScene = dynamic(() => import('./CosmicScene'), { ssr: false });

const RAD = Math.PI / 180;
const POSTER_R: Record<string, number> = { Moon: 30, Mercury: 38, Venus: 46, Sun: 54, Mars: 62, Jupiter: 70, Saturn: 78, Rahu: 84, Ketu: 84 };
const POSTER_C: Record<string, string> = {
  Moon: '#eef1ff', Mercury: '#9be8b8', Venus: '#fff3dc', Sun: '#ffb35c', Mars: '#ff6b4a', Jupiter: '#f3c26b', Saturn: '#e9d8a6', Rahu: '#a996ff', Ketu: '#a996ff',
};

/** Static SVG twin of the 3D scene with today's real positions: shown first, kept for low-power devices. */
function Poster({ sky }: { sky: LiveSky }) {
  return (
    <svg viewBox="-110 -110 220 220" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="hv-earth"><stop offset="0" stopColor="#8fb5ff" /><stop offset=".4" stopColor="#3f7fd9" /><stop offset="1" stopColor="#1b4fa8" stopOpacity="0" /></radialGradient>
        <radialGradient id="hv-sun"><stop offset="0" stopColor="#ffd68c" /><stop offset=".4" stopColor="#ff9a3d" stopOpacity=".8" /><stop offset="1" stopColor="#f5731a" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform="scale(1 .55)">
        <circle r="108" fill="none" stroke="#f2c25b" strokeOpacity=".6" strokeWidth=".8" />
        <circle r="88" fill="none" stroke="#f2c25b" strokeOpacity=".9" strokeWidth="1.2" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="88" x2="108" stroke="#ff8f36" strokeOpacity=".6" strokeWidth=".6" transform={`rotate(${-i * 30})`} />
        ))}
        {Object.values(POSTER_R).filter((r, i, a) => a.indexOf(r) === i).map((r) => (
          <circle key={r} r={r} fill="none" stroke="#f2c25b" strokeOpacity=".18" strokeWidth=".6" />
        ))}
        <circle r="16" fill="url(#hv-earth)" />
        <circle r="7" fill="#3f7fd9" />
        {sky.planets.map((p) => {
          const r = POSTER_R[p.graha];
          // rounded so server and client markup agree to the digit
          const x = Math.round(Math.cos(p.lon * RAD) * r * 100) / 100;
          const y = Math.round(-Math.sin(p.lon * RAD) * r * 100) / 100;
          return p.graha === 'Sun' ? (
            <g key={p.graha}><circle cx={x} cy={y} r="14" fill="url(#hv-sun)" /><circle cx={x} cy={y} r="4.5" fill="#ffb35c" /></g>
          ) : (
            <circle key={p.graha} cx={x} cy={y} r={p.graha === 'Jupiter' ? 3 : 2.2} fill={POSTER_C[p.graha]} fillOpacity={p.graha === 'Rahu' || p.graha === 'Ketu' ? 0.5 : 1} />
          );
        })}
      </g>
    </svg>
  );
}

export function HeroVisual({ sky, className = '' }: { sky: LiveSky; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const weak = (nav.hardwareConcurrency || 4) <= 2 || (nav.deviceMemory || 4) <= 2 || nav.connection?.saveData;
    let hasGL = false;
    try { hasGL = !!document.createElement('canvas').getContext('webgl2'); } catch {}
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (weak || !hasGL) return;
    // wait until the main thread is idle so 3D never competes with first paint
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number; cancelIdleCallback?: (id: number) => void };
    const id = w.requestIdleCallback ? w.requestIdleCallback(() => setEnabled(true)) : window.setTimeout(() => setEnabled(true), 300);
    return () => (w.cancelIdleCallback ? w.cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  useEffect(() => {
    if (!box.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.05 });
    io.observe(box.current);
    const onVis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  useEffect(() => {
    if (enabled) { const t = setTimeout(() => setReady(true), 400); return () => clearTimeout(t); }
  }, [enabled]);

  const moon = sky.planets.find((p) => p.graha === 'Moon');
  const retro = sky.planets.filter((p) => p.retro && p.graha !== 'Rahu' && p.graha !== 'Ketu');

  return (
    <div className={`flex min-w-0 flex-col ${className}`}>
      <div ref={box} className="relative aspect-square w-full">
        <div className={`absolute inset-[8%] transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}><Poster sky={sky} /></div>
        {enabled && (
          <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
            <CosmicScene active={visible && !reduced} sky={sky} />
          </div>
        )}
      </div>
      <Link
        href="/transits"
        className="group mx-auto -mt-4 flex w-full max-w-fit min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/5 py-2 pl-3 pr-4 text-xs text-white/75 backdrop-blur transition hover:border-gold-400/40 hover:bg-white/10"
      >
        <span className="relative flex h-2 w-2 shrink-0"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf opacity-70" /><span className="relative inline-flex h-2 w-2 rounded-full bg-leaf" /></span>
        <span className="min-w-0 text-center">
          <span className="font-semibold text-gold-300">Live sky</span>
          {moon && <> · Chandra in <span className="text-white">{moon.nakshatraName}</span>, {moon.signName} {Math.floor(moon.degInSign)}°</>}
          {' · '}{Math.round(sky.moon.fraction * 100)}% lit, {sky.moon.waxing ? 'waxing' : 'waning'}
          {retro.length > 0 && <> · <span className="text-saffron-300">{retro.map((p) => p.hindi).join(', ')} retrograde</span></>}
        </span>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
