'use client';

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { LiveSky, SkyPlanet } from '@/lib/astro/sky';
import type { Graha } from '@/lib/astro/constants';

/*
 * A geocentric "live sky", laid out like a kundli: Earth (the observer) at the centre, every graha on
 * its own ring at its true sidereal longitude, the zodiac band around them. The Sun is the only real
 * light source, so the Moon and planets show their actual phase relative to the Sun.
 */

const RAD = Math.PI / 180;
const NAK = 360 / 27;
const GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => g + '︎');
const GOLD = new THREE.Color('#f2c25b');
const SAFFRON = new THREE.Color('#ff8f36');

const STYLE: Record<Graha, { color: string; size: number; radius: number; glow: number }> = {
  Moon: { color: '#eef1ff', size: 0.16, radius: 1.3, glow: 0.9 },
  Mercury: { color: '#9be8b8', size: 0.1, radius: 1.7, glow: 0.6 },
  Venus: { color: '#fff3dc', size: 0.15, radius: 2.05, glow: 0.9 },
  Sun: { color: '#ffb35c', size: 0.34, radius: 2.45, glow: 2.4 },
  Mars: { color: '#ff6b4a', size: 0.13, radius: 2.8, glow: 0.7 },
  Jupiter: { color: '#f3c26b', size: 0.24, radius: 3.15, glow: 0.9 },
  Saturn: { color: '#e9d8a6', size: 0.19, radius: 3.5, glow: 0.8 },
  Rahu: { color: '#a996ff', size: 0.12, radius: 3.78, glow: 0.6 },
  Ketu: { color: '#a996ff', size: 0.12, radius: 3.78, glow: 0.6 },
};
const NODES = new Set<Graha>(['Rahu', 'Ketu']);
const RING_IN = 3.95;
const RING_OUT = 4.95;

/* ---------- canvas textures ---------- */

function glyphTexture(ch: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  x.fillStyle = '#f6d58a';
  x.font = '76px "Segoe UI Symbol", "Noto Sans Symbols 2", "Apple Symbols", serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.shadowColor = 'rgba(255,143,54,.9)';
  x.shadowBlur = 14;
  x.fillText(ch, 64, 68);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function glowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,.4)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, inner);
  g.addColorStop(0.3, mid);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ---------- background ---------- */

function Stars({ count = 1800 }) {
  const near = useRef<THREE.Points>(null);
  const far = useRef<THREE.Points>(null);
  const nearMat = useRef<THREE.PointsMaterial>(null);
  const make = (n: number, r0: number, r1: number) => {
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = r0 + Math.random() * (r1 - r0);
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      p.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  };
  const geoNear = useMemo(() => make(Math.floor(count * 0.35), 16, 30), [count]);
  const geoFar = useMemo(() => make(count, 30, 60), [count]);
  useFrame(({ clock }, d) => {
    if (near.current) near.current.rotation.y += d * 0.012;
    if (far.current) far.current.rotation.y += d * 0.005;
    if (nearMat.current) nearMat.current.opacity = 0.75 + Math.sin(clock.elapsedTime * 1.7) * 0.2;
  });
  return (
    <>
      <points ref={far} geometry={geoFar}>
        <pointsMaterial size={0.08} color="#fff6e0" transparent opacity={0.8} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={near} geometry={geoNear}>
        <pointsMaterial ref={nearMat} size={0.14} color="#ffe9b8" transparent opacity={0.9} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
}

/** A streak that crosses the background every few seconds. */
function ShootingStar() {
  const ref = useRef<THREE.Sprite>(null);
  const tex = useMemo(() => glowTexture('rgba(255,250,235,1)', 'rgba(255,220,160,.5)'), []);
  const s = useRef({ next: 2.5, t0: -1, from: new THREE.Vector3(), dir: new THREE.Vector3() });
  useFrame(({ clock }) => {
    const sp = ref.current;
    if (!sp) return;
    const t = clock.elapsedTime;
    const st = s.current;
    if (st.t0 < 0 && t > st.next) {
      st.t0 = t;
      st.from.set(-9 + Math.random() * 10, 3 + Math.random() * 4, -8 - Math.random() * 4);
      st.dir.set(5 + Math.random() * 4, -3 - Math.random() * 2, 0).normalize();
      sp.material.rotation = -Math.atan2(-st.dir.y, st.dir.x);
    }
    if (st.t0 >= 0) {
      const k = (t - st.t0) / 0.9;
      if (k >= 1) {
        st.t0 = -1;
        st.next = t + 4 + Math.random() * 7;
        sp.material.opacity = 0;
        return;
      }
      sp.position.copy(st.from).addScaledVector(st.dir, k * 9);
      sp.material.opacity = Math.sin(k * Math.PI) * 0.9;
      sp.scale.set(2.2, 0.06, 1);
    }
  });
  return (
    <sprite ref={ref} scale={[2.2, 0.06, 1]}>
      <spriteMaterial map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

/* ---------- the sky disc ---------- */

const onRing = (lon: number, r: number): [number, number, number] => [Math.cos(lon * RAD) * r, Math.sin(lon * RAD) * r, 0];

/** Fading line of where the planet has been recently, ending at its current position. */
function Trail({ p }: { p: SkyPlanet }) {
  const line = useMemo(() => {
    const lons = [...p.trail, p.lon];
    const r = STYLE[p.graha].radius;
    const pts: number[] = [];
    const cols: number[] = [];
    const c = new THREE.Color(STYLE[p.graha].color);
    lons.forEach((lon, i) => {
      pts.push(...onRing(lon, r));
      const k = Math.pow(i / (lons.length - 1), 1.6) * 0.85;
      cols.push(c.r * k, c.g * k, c.b * k);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    const m = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    return new THREE.Line(g, m);
  }, [p]);
  return <primitive object={line} />;
}

function Planet({ p, hovered, onHover }: { p: SkyPlanet; hovered: boolean; onHover: (g: Graha | null) => void }) {
  const s = STYLE[p.graha];
  const glow = useMemo(() => {
    const c = new THREE.Color(s.color);
    const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
    return glowTexture(`rgba(${rgb},1)`, `rgba(${rgb},.35)`);
  }, [s.color]);
  const node = NODES.has(p.graha);
  const sun = p.graha === 'Sun';
  const spin = useRef<THREE.Mesh>(null);
  useFrame((_, d) => { if (spin.current) spin.current.rotation.y += d * 0.4; });

  return (
    <group position={onRing(p.lon, s.radius)}>
      {/* generous invisible hit area */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); onHover(p.graha); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = ''; }}
      >
        <sphereGeometry args={[Math.max(s.size * 2.2, 0.3), 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={spin}>
        <sphereGeometry args={[s.size, 32, 32]} />
        {sun ? (
          <meshBasicMaterial color={s.color} />
        ) : node ? (
          <meshBasicMaterial color={s.color} transparent opacity={0.45} wireframe />
        ) : (
          <meshStandardMaterial color={s.color} roughness={0.7} metalness={0.05} emissive={s.color} emissiveIntensity={0.08} />
        )}
      </mesh>
      {p.graha === 'Saturn' && (
        <mesh rotation={[0.35, 0.2, 0]}>
          <ringGeometry args={[s.size * 1.5, s.size * 2.3, 48]} />
          <meshBasicMaterial color="#d9c48a" transparent opacity={0.6} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      <sprite scale={[s.size * 6 * s.glow + 0.4, s.size * 6 * s.glow + 0.4, 1]}>
        <spriteMaterial map={glow} transparent opacity={sun ? 0.95 : 0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {sun && <pointLight intensity={26} distance={12} decay={1.6} color="#ffd08a" />}
      {hovered && (
        <Html position={[0, s.size + 0.25, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-xl border border-white/15 bg-night-900/90 px-3 py-2 text-xs text-white shadow-lift backdrop-blur">
            <div className="font-display text-sm font-semibold text-gold-300">
              {p.hindi} <span className="font-sans text-xs font-normal text-white/60">· {p.graha}</span>
            </div>
            <div className="mt-0.5 text-white/85">
              {p.signName} {Math.floor(p.degInSign)}° · {p.nakshatraName}
              {p.retro && !node && <span className="ml-1.5 rounded bg-saffron-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-saffron-300">Retrograde</span>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Earth() {
  const ref = useRef<THREE.Mesh>(null);
  const halo = useMemo(() => glowTexture('rgba(120,170,255,.9)', 'rgba(70,120,230,.35)'), []);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.25; });
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshStandardMaterial color="#3f7fd9" emissive="#1b4fa8" emissiveIntensity={0.55} roughness={0.5} />
      </mesh>
      <sprite scale={[1.9, 1.9, 1]}>
        <spriteMaterial map={halo} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

function Zodiac({ moonNak }: { moonNak: number }) {
  const glyphs = useMemo(() => GLYPHS.map(glyphTexture), []);
  return (
    <group>
      <mesh>
        <ringGeometry args={[RING_IN, RING_IN + 0.06, 180]} />
        <meshBasicMaterial color={GOLD} side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      <mesh>
        <ringGeometry args={[RING_OUT, RING_OUT + 0.045, 180]} />
        <meshBasicMaterial color={GOLD} side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
      {/* the Moon's current nakshatra, lit up */}
      <mesh>
        <ringGeometry args={[RING_IN + 0.08, RING_IN + 0.26, 24, 1, moonNak * NAK * RAD, NAK * RAD]} />
        <meshBasicMaterial color={SAFFRON} side={THREE.DoubleSide} transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* 27 nakshatra ticks */}
      {Array.from({ length: 27 }).map((_, i) => {
        const a = i * NAK * RAD;
        return (
          <mesh key={i} position={[Math.cos(a) * (RING_IN + 0.17), Math.sin(a) * (RING_IN + 0.17), 0]} rotation={[0, 0, a]}>
            <planeGeometry args={[0.2, 0.008]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.45} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
      {/* 12 rashis */}
      {GLYPHS.map((_, i) => {
        const a = i * 30 * RAD;
        const b = (i * 30 + 15) * RAD;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * ((RING_IN + RING_OUT) / 2), Math.sin(a) * ((RING_IN + RING_OUT) / 2), 0]} rotation={[0, 0, a]}>
              <planeGeometry args={[RING_OUT - RING_IN, 0.012]} />
              <meshBasicMaterial color={SAFFRON} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
            <sprite position={[Math.cos(b) * 4.5, Math.sin(b) * 4.5, 0]} scale={[0.5, 0.5, 1]}>
              <spriteMaterial map={glyphs[i]} transparent depthWrite={false} />
            </sprite>
          </group>
        );
      })}
      {/* orbit guides */}
      {Object.values(STYLE)
        .map((s) => s.radius)
        .filter((r, i, a) => a.indexOf(r) === i)
        .map((r) => (
          <mesh key={r}>
            <ringGeometry args={[r - 0.006, r + 0.006, 160]} />
            <meshBasicMaterial color={GOLD} side={THREE.DoubleSide} transparent opacity={0.16} />
          </mesh>
        ))}
    </group>
  );
}

function Sky({ sky }: { sky: LiveSky }) {
  const root = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<Graha | null>(null);
  const { pointer } = useThree();
  const moonNak = sky.planets.find((p) => p.graha === 'Moon')?.nakshatra ?? 0;

  useFrame((_, d) => {
    if (disc.current && !hovered) disc.current.rotation.z += d * 0.02;
    if (root.current) {
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -0.95 + pointer.y * 0.18, 0.04);
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, pointer.x * 0.28, 0.04);
    }
  });

  return (
    <group ref={root} rotation={[-0.95, 0, 0]}>
      <group ref={disc} rotation={[Math.PI / 2, 0, 0]}>
        <Earth />
        <Zodiac moonNak={moonNak} />
        {sky.planets.map((p) => (
          <group key={p.graha}>
            {p.trail.length > 0 && <Trail p={p} />}
            <Planet p={p} hovered={hovered === p.graha} onHover={setHovered} />
          </group>
        ))}
      </group>
    </group>
  );
}

export default function CosmicScene({ active, sky }: { active: boolean; sky: LiveSky }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'demand'}
      camera={{ position: [0, 0, 13.4], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.22} />
      <directionalLight position={[4, 8, 10]} intensity={0.25} />
      <Stars />
      <ShootingStar />
      <Sky sky={sky} />
    </Canvas>
  );
}
