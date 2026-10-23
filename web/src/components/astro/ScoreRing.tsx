/** Circular score gauge (SVG, no JS). */
export function ScoreRing({ value, max, size = 180, label }: { value: number; max: number; size?: number; label?: string }) {
  const r = 80;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value / max));
  const color = pct >= 0.69 ? '#18a058' : pct >= 0.5 ? '#f5731a' : '#e0475b';
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={`${value} out of ${max}`}>
      <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(242,194,91,.18)" strokeWidth="14" />
      <circle
        cx="100" cy="100" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 100 100)"
      />
      <text x="100" y="98" textAnchor="middle" fontSize="46" fontWeight="700" fill="currentColor" style={{ fontFamily: 'var(--font-fraunces)' }}>{value}</text>
      <text x="100" y="128" textAnchor="middle" fontSize="14" fill="currentColor" opacity=".6">{label ?? `out of ${max}`}</text>
    </svg>
  );
}
