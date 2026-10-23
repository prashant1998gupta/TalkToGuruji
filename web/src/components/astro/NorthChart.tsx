import { GRAHA_ABBR, type Graha } from '@/lib/astro/constants';

// Label anchor for each house (1–12) and where its sign number sits, on a 400×400 square.
const HOUSE_POS: [number, number][] = [
  [200, 105], [100, 42], [40, 100], [100, 200], [40, 300], [100, 360], [200, 295], [300, 360], [360, 300], [300, 200], [360, 100], [300, 42],
];
const SIGN_POS: [number, number][] = [
  [200, 178], [100, 84], [84, 100], [178, 200], [84, 300], [100, 318], [200, 224], [300, 318], [318, 300], [224, 200], [318, 100], [300, 84],
];

type House = { house: number; sign: number; planets: Graha[] };

/** North-Indian diamond chart. `retro` lists grahas to mark with (R). */
export function NorthChart({ houses, title, retro = [], ascLabel = true }: { houses: House[]; title: string; retro?: Graha[]; ascLabel?: boolean }) {
  return (
    <figure className="w-full">
      <svg viewBox="-6 -6 412 412" className="h-auto w-full" role="img" aria-label={title}>
        <defs>
          <linearGradient id="nc-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffdf9" />
            <stop offset="1" stopColor="#fbf0df" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="400" height="400" rx="10" fill="url(#nc-bg)" stroke="#e3a72f" strokeWidth="2" />
        <g stroke="#e3a72f" strokeWidth="1.4" fill="none">
          <line x1="0" y1="0" x2="400" y2="400" />
          <line x1="400" y1="0" x2="0" y2="400" />
          <polygon points="200,0 400,200 200,400 0,200" />
        </g>
        {houses.map((h, i) => {
          const [x, y] = HOUSE_POS[i];
          const [sx, sy] = SIGN_POS[i];
          const items = [...(i === 0 && ascLabel ? ['Asc'] : []), ...h.planets.map((p) => GRAHA_ABBR[p] + (retro.includes(p) && p !== 'Rahu' && p !== 'Ketu' ? '*' : ''))];
          const narrow = ![0, 3, 6, 9].includes(i);
          const perRow = narrow ? 2 : 3;
          const rows: string[][] = [];
          items.forEach((it, k) => { (rows[Math.floor(k / perRow)] ||= []).push(it); });
          const lineH = 17;
          const y0 = y - ((rows.length - 1) * lineH) / 2;
          return (
            <g key={h.house}>
              <text x={sx} y={sy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#9b8e78" fontWeight="600">{h.sign + 1}</text>
              {rows.map((r, ri) => (
                <text key={ri} x={x} y={y0 + ri * lineH} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="700">
                  {r.map((it, k) => (
                    <tspan key={k} fill={it === 'Asc' ? '#d95a0b' : '#1c1640'} dx={k ? 6 : 0}>{it}</tspan>
                  ))}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted">{title}</figcaption>
    </figure>
  );
}
