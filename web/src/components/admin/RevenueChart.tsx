type Day = { label: string; payments: number; billing: number; sessions: number };

/** 14-day stacked bars (payments + consult billing, ₹) with a sessions line. Pure SVG. */
export function RevenueChart({ days }: { days: Day[] }) {
  const W = 720, H = 240, P = { l: 48, r: 36, t: 16, b: 28 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const maxR = Math.max(100, ...days.map((d) => d.payments + d.billing));
  const maxS = Math.max(4, ...days.map((d) => d.sessions));
  const niceMax = niceCeil(maxR);
  const bw = (iw / days.length) * 0.56;
  const x = (i: number) => P.l + (iw / days.length) * (i + 0.5);
  const yR = (v: number) => P.t + ih - (v / niceMax) * ih;
  const yS = (v: number) => P.t + ih - (v / maxS) * ih;
  const line = days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${yS(d.sessions).toFixed(1)}`).join(' ');
  const fmt = (v: number) => (v >= 1000 ? `₹${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₹${Math.round(v)}`);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Revenue and consultations over the last 14 days">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={yR(niceMax * t)} y2={yR(niceMax * t)} stroke="#ece5d8" strokeDasharray={t ? '3 4' : undefined} />
            <text x={P.l - 8} y={yR(niceMax * t) + 4} textAnchor="end" fontSize="10" fill="#6c6782">{fmt(niceMax * t)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const hp = (d.payments / niceMax) * ih;
          const hb = (d.billing / niceMax) * ih;
          return (
            <g key={i}>
              <title>{`${d.label}: payments ${fmt(d.payments)}, consultation billing ${fmt(d.billing)}, ${d.sessions} consultations`}</title>
              <rect x={x(i) - bw / 2} y={P.t + ih - hp} width={bw} height={Math.max(0, hp)} rx="3" fill="#f5731a" />
              <rect x={x(i) - bw / 2} y={P.t + ih - hp - hb} width={bw} height={Math.max(0, hb)} rx="3" fill="#2a2160" />
              {((days.length - 1 - i) % 2 === 0 || days.length <= 8) && <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#6c6782">{d.label}</text>}
            </g>
          );
        })}
        <path d={line} fill="none" stroke="#e3a72f" strokeWidth="2" strokeLinejoin="round" />
        {days.map((d, i) => <circle key={i} cx={x(i)} cy={yS(d.sessions)} r="3" fill="#fff" stroke="#e3a72f" strokeWidth="2" />)}
        <text x={W - P.r + 6} y={P.t + 4} fontSize="10" fill="#b37f17">{maxS}</text>
        <text x={W - P.r + 6} y={P.t + ih + 4} fontSize="10" fill="#b37f17">0</text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-saffron-500" /> Payments received</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-night-700" /> Consultation billing</span>
        <span className="flex items-center gap-1.5"><i className="h-0.5 w-4 bg-gold-500" /> Consultations (right axis)</span>
      </div>
    </div>
  );
}

function niceCeil(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((n) => n >= v) || v;
}
