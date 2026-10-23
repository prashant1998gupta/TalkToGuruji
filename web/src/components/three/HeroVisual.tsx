'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

// three.js (~150 kB gz) is split into its own chunk and only fetched on capable devices.
const CosmicScene = dynamic(() => import('./CosmicScene'), { ssr: false });

/** Static SVG twin of the 3D scene: shown first, kept for low-power devices. */
function Poster() {
  return (
    <svg viewBox="-110 -110 220 220" className="h-full w-full" aria-hidden="true">
      <defs>
        <radialGradient id="hv-sun"><stop offset="0" stopColor="#ffd68c" /><stop offset=".35" stopColor="#ff9a3d" /><stop offset="1" stopColor="#f5731a" stopOpacity="0" /></radialGradient>
      </defs>
      <g transform="scale(1 .55)">
        <circle r="96" fill="none" stroke="#f2c25b" strokeOpacity=".7" strokeWidth=".8" />
        <circle r="78" fill="none" stroke="#f2c25b" strokeOpacity=".9" strokeWidth="1.2" />
        <circle r="68" fill="none" stroke="#f2c25b" strokeOpacity=".25" strokeWidth=".6" />
        <circle r="56" fill="none" stroke="#f2c25b" strokeOpacity=".22" strokeWidth=".6" />
        <circle r="45" fill="none" stroke="#f2c25b" strokeOpacity=".2" strokeWidth=".6" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1="78" x2="96" stroke="#ff8f36" strokeOpacity=".6" strokeWidth=".6" transform={`rotate(${i * 30})`} />
        ))}
      </g>
      <ellipse rx="34" ry="34" fill="none" stroke="#f2c25b" strokeOpacity=".5" strokeWidth=".6" />
      <ellipse rx="17" ry="34" fill="none" stroke="#f2c25b" strokeOpacity=".5" strokeWidth=".6" />
      <circle r="40" fill="url(#hv-sun)" />
      <circle r="13" fill="#ffb35c" />
    </svg>
  );
}

export function HeroVisual({ className = '' }: { className?: string }) {
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

  return (
    <div ref={box} className={`relative ${className}`}>
      <div className={`absolute inset-[8%] transition-opacity duration-700 ${ready ? 'opacity-0' : 'opacity-100'}`}><Poster /></div>
      {enabled && (
        <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
          <CosmicScene active={visible && !reduced} />
        </div>
      )}
    </div>
  );
}
