/**
 * "Live sky" for the home-page hero: the real sidereal positions of the nine grahas
 * right now, with a short trail of where each one has been recently.
 * Cached in 10-minute buckets so the home page never recomputes the ephemeris per request.
 */
import { A, norm, planetPositions, siderealLongitude } from './engine';
import { GRAHA_HI, type Graha } from './constants';

export type SkyPlanet = {
  graha: Graha;
  hindi: string;
  lon: number; // sidereal 0–360
  signName: string;
  degInSign: number;
  nakshatra: number;
  nakshatraName: string;
  retro: boolean;
  /** Sidereal longitudes sampled over recent days, oldest first (current position not included). */
  trail: number[];
};

export type LiveSky = {
  at: string; // ISO
  whenLabel: string; // "23 Oct 2026, 10:58 pm IST"
  planets: SkyPlanet[];
  moon: { fraction: number; waxing: boolean };
};

/** Days of history and sampling step per graha — long enough to show retrograde loops. */
const TRAIL: Partial<Record<Graha, [days: number, stepDays: number]>> = {
  Moon: [4, 0.25],
  Mercury: [45, 1],
  Venus: [45, 1],
  Sun: [45, 1],
  Mars: [70, 1],
  Jupiter: [100, 2],
  Saturn: [140, 2],
};

const round = (x: number) => Math.round(x * 1000) / 1000;

let cache: { bucket: number; sky: LiveSky } | null = null;

export function liveSky(now = new Date()): LiveSky {
  const bucket = Math.floor(now.getTime() / 600000);
  if (cache?.bucket === bucket) return cache.sky;

  const planets: SkyPlanet[] = planetPositions(now).map((p) => {
    const t = TRAIL[p.graha];
    const trail: number[] = [];
    if (t) for (let d = t[0]; d > 0; d -= t[1]) trail.push(round(siderealLongitude(p.graha, new Date(now.getTime() - d * 86400000))));
    return {
      graha: p.graha,
      hindi: GRAHA_HI[p.graha],
      lon: round(p.lon),
      signName: p.signName,
      degInSign: round(p.degInSign),
      nakshatra: p.nakshatra,
      nakshatraName: p.nakshatraName,
      retro: p.retro,
      trail,
    };
  });

  const sun = planets.find((p) => p.graha === 'Sun')!.lon;
  const moon = planets.find((p) => p.graha === 'Moon')!.lon;
  const ill = A.Illumination(A.Body.Moon, now);
  const whenLabel =
    new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(now) +
    ' IST';

  const sky: LiveSky = { at: now.toISOString(), whenLabel, planets, moon: { fraction: round(ill.phase_fraction), waxing: norm(moon - sun) < 180 } };
  cache = { bucket, sky };
  return sky;
}
