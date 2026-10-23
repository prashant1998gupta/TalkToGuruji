import { GRAHA_HI, type Graha } from '@/lib/astro/constants';
import { fmtDeg } from '@/lib/astro/engine';

type Row = { graha: Graha | 'Ascendant'; signName: string; degInSign: number; nakshatraName: string; pada: number; nakLord: Graha; retro: boolean; house?: number; dignity?: string };

export function PlanetTable({ rows, showHouse = true }: { rows: Row[]; showHouse?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
        <thead>
          <tr className="bg-cream-100 text-left text-[11px] font-bold uppercase tracking-wider text-muted">
            <th className="px-4 py-3">Graha</th>
            <th className="px-4 py-3">Rashi</th>
            <th className="px-4 py-3">Degree</th>
            <th className="px-4 py-3">Nakshatra</th>
            <th className="px-4 py-3">Nak. lord</th>
            {showHouse && <th className="px-4 py-3">House</th>}
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((p) => (
            <tr key={p.graha} className="hover:bg-cream-50">
              <td className="px-4 py-3 font-semibold text-night-900">
                {p.graha} <span className="text-xs font-normal text-muted">{p.graha === 'Ascendant' ? 'Lagna' : GRAHA_HI[p.graha]}</span>
              </td>
              <td className="px-4 py-3">{p.signName}</td>
              <td className="px-4 py-3 font-mono text-[13px] tabular-nums">{fmtDeg(p.degInSign)}</td>
              <td className="px-4 py-3">{p.nakshatraName} <span className="text-muted">· {p.pada}</span></td>
              <td className="px-4 py-3 text-muted">{p.nakLord}</td>
              {showHouse && <td className="px-4 py-3 tabular-nums">{p.house}</td>}
              <td className="px-4 py-3">
                <span className="flex flex-wrap gap-1">
                  {p.retro && p.graha !== 'Rahu' && p.graha !== 'Ketu' && <span className="rounded-full bg-rose/10 px-2 py-0.5 text-[10px] font-bold uppercase text-rose">Retro</span>}
                  {p.dignity && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${p.dignity === 'Debilitated' ? 'bg-cream-200 text-ink/70' : 'bg-leaf/10 text-leaf'}`}>{p.dignity}</span>
                  )}
                  {!p.dignity && !(p.retro && p.graha !== 'Rahu' && p.graha !== 'Ketu') && <span className="text-muted">—</span>}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
