'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => g + '︎');
const GOLD = new THREE.Color('#f2c25b');
const SAFFRON = new THREE.Color('#ff8f36');

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

function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d')!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,214,140,1)');
  g.addColorStop(0.25, 'rgba(255,150,60,.55)');
  g.addColorStop(0.6, 'rgba(245,115,26,.12)');
  g.addColorStop(1, 'rgba(245,115,26,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

function Stars({ count = 1600 }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 18 + Math.random() * 40;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      p.set([r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return g;
  }, [count]);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.008; });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.09} color="#fff6e0" transparent opacity={0.85} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function Orbit({ radius, speed, size, color, tilt = 0, phase = 0 }: { radius: number; speed: number; size: number; color: string; tilt?: number; phase?: number }) {
  const planet = useRef<THREE.Mesh>(null);
  const ring = useMemo(() => {
    const pts = new THREE.EllipseCurve(0, 0, radius, radius).getPoints(128).map((p) => new THREE.Vector3(p.x, 0, p.y));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * speed + phase;
    planet.current?.position.set(Math.cos(t) * radius, 0, Math.sin(t) * radius);
  });
  return (
    <group rotation={[tilt, 0, 0]}>
      <lineLoop geometry={ring}>
        <lineBasicMaterial color="#f2c25b" transparent opacity={0.22} />
      </lineLoop>
      <mesh ref={planet}>
        <sphereGeometry args={[size, 24, 24]} />
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.2} emissive={color} emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function Astrolabe() {
  const root = useRef<THREE.Group>(null);
  const zodiac = useRef<THREE.Group>(null);
  const meridians = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  const glyphs = useMemo(() => GLYPHS.map(glyphTexture), []);
  const glow = useMemo(glowTexture, []);

  useFrame((_, d) => {
    if (zodiac.current) zodiac.current.rotation.z -= d * 0.05;
    if (meridians.current) meridians.current.rotation.y += d * 0.12;
    if (root.current) {
      // gentle parallax toward the pointer
      root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -0.95 + pointer.y * 0.18, 0.04);
      root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, pointer.x * 0.28, 0.04);
    }
  });

  return (
    <group ref={root} rotation={[-0.95, 0, 0]}>
      {/* sun */}
      <mesh>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshStandardMaterial color="#ffb35c" emissive="#ff9a3d" emissiveIntensity={1.3} roughness={0.35} />
      </mesh>
      <sprite scale={[3.4, 3.4, 1]}>
        <spriteMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* armillary meridians */}
      <group ref={meridians}>
        {[0, Math.PI / 3, -Math.PI / 3].map((r, i) => (
          <mesh key={i} rotation={[Math.PI / 2, r, 0]}>
            <torusGeometry args={[1.55, 0.012, 8, 120]} />
            <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.25} emissive={GOLD} emissiveIntensity={0.15} />
          </mesh>
        ))}
      </group>

      {/* planets */}
      <Orbit radius={2.05} speed={0.55} size={0.09} color="#c9d2ff" phase={1} />
      <Orbit radius={2.55} speed={0.36} size={0.13} color="#ff7a59" tilt={0.08} phase={3} />
      <Orbit radius={3.1} speed={0.24} size={0.17} color="#f2c25b" tilt={-0.06} phase={5} />

      {/* zodiac band */}
      <group ref={zodiac} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[3.55, 3.62, 160]} />
          <meshBasicMaterial color={GOLD} side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
        <mesh>
          <ringGeometry args={[4.42, 4.47, 160]} />
          <meshBasicMaterial color={GOLD} side={THREE.DoubleSide} transparent opacity={0.65} />
        </mesh>
        {GLYPHS.map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const b = a + Math.PI / 12;
          return (
            <group key={i}>
              <mesh position={[Math.cos(a) * 4.0, Math.sin(a) * 4.0, 0]} rotation={[0, 0, a]}>
                <planeGeometry args={[0.88, 0.012]} />
                <meshBasicMaterial color={SAFFRON} transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
              <sprite position={[Math.cos(b) * 4.0, Math.sin(b) * 4.0, 0]} scale={[0.5, 0.5, 1]}>
                <spriteMaterial map={glyphs[i]} transparent depthWrite={false} />
              </sprite>
            </group>
          );
        })}
      </group>
    </group>
  );
}

export default function CosmicScene({ active }: { active: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'demand'}
      camera={{ position: [0, 0, 12.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 0]} intensity={30} distance={14} color="#ffb35c" />
      <directionalLight position={[5, 6, 8]} intensity={0.8} />
      <Stars />
      <Astrolabe />
    </Canvas>
  );
}
