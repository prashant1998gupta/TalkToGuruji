/** Current graha positions and upcoming sign changes (gochar). */
import { GRAHAS, RASHIS, type Graha } from './constants';
import { planetPositions, siderealLongitude } from './engine';

export function currentTransits(at = new Date()) {
  return planetPositions(at);
}

export type Ingress = { graha: Graha; date: Date; from: string; to: string; retro: boolean };

/** Sign ingresses for all grahas between now and `days` ahead (daily scan + bisection). */
export function upcomingIngresses(days = 365, from = new Date()): Ingress[] {
  const out: Ingress[] = [];
  const DAY = 86400000;
  for (const g of GRAHAS) {
    // Ketu mirrors Rahu; the Moon changes sign every ~2.5 days, too often to be useful here
    if (g === 'Ketu' || g === 'Moon') continue;
    const step = DAY;
    let t = from.getTime();
    let s = Math.floor(siderealLongitude(g, new Date(t)) / 30);
    for (let i = 0; i < days; i++) {
      const t2 = t + step;
      const s2 = Math.floor(siderealLongitude(g, new Date(t2)) / 30);
      if (s2 !== s) {
        let lo = t, hi = t2;
        while (hi - lo > 60000) {
          const mid = (lo + hi) / 2;
          if (Math.floor(siderealLongitude(g, new Date(mid)) / 30) === s) lo = mid; else hi = mid;
        }
        const retro = (s2 - s + 12) % 12 === 11;
        out.push({ graha: g, date: new Date(hi), from: RASHIS[s], to: RASHIS[s2], retro: g === 'Rahu' ? false : retro });
        if (g === 'Rahu') out.push({ graha: 'Ketu', date: new Date(hi), from: RASHIS[(s + 6) % 12], to: RASHIS[(s2 + 6) % 12], retro: false });
        s = s2;
      }
      t = t2;
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}
