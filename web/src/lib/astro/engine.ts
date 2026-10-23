/**
 * Core sidereal astronomy for Vedic charts, built on astronomy-engine.
 * Longitudes are geocentric, true ecliptic of date, converted to sidereal with Lahiri ayanamsa.
 */
import * as A from 'astronomy-engine';
import { DASHA_ORDER, GRAHAS, NAKSHATRAS, RASHIS, type Graha } from './constants';

export const norm = (x: number) => ((x % 360) + 360) % 360;
const RAD = Math.PI / 180;
const NAK = 360 / 27;

const julianCenturies = (d: Date) => (d.getTime() / 86400000 + 2440587.5 - 2451545.0) / 36525;

/** Lahiri (Chitrapaksha) ayanamsa in degrees. 23°51'11" at J2000, precessing ~50.29"/yr. */
export function lahiriAyanamsa(d: Date) {
  const T = julianCenturies(d);
  return 23.853055 + 1.396971 * T + 0.000308 * T * T;
}

/** Mean lunar node (Rahu), tropical. */
function meanNode(d: Date) {
  const T = julianCenturies(d);
  return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441);
}

function tropicalLongitude(body: Graha, d: Date): number {
  switch (body) {
    case 'Sun': return A.SunPosition(d).elon;
    case 'Moon': return A.EclipticGeoMoon(d).lon;
    case 'Rahu': return meanNode(d);
    case 'Ketu': return norm(meanNode(d) + 180);
    default: return A.Ecliptic(A.GeoVector(body as unknown as A.Body, d, true)).elon;
  }
}

export const siderealLongitude = (body: Graha, d: Date) => norm(tropicalLongitude(body, d) - lahiriAyanamsa(d));

/** Daily motion (deg/day) — negative means retrograde. */
export function dailyMotion(body: Graha, d: Date) {
  if (body === 'Rahu' || body === 'Ketu') return -0.0529;
  const a = tropicalLongitude(body, new Date(d.getTime() - 43200000));
  const b = tropicalLongitude(body, new Date(d.getTime() + 43200000));
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

/** Sidereal ascendant (lagna). */
export function ascendant(d: Date, lat: number, lon: number) {
  const gast = A.SiderealTime(d); // hours
  const ramc = norm(gast * 15 + lon) * RAD;
  const eps = A.e_tilt(A.MakeTime(d)).tobl * RAD;
  const phi = lat * RAD;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / RAD;
  return norm(norm(asc) - lahiriAyanamsa(d));
}

export type PointInfo = {
  lon: number; // sidereal 0–360
  sign: number; // 0 = Aries
  signName: string;
  degInSign: number;
  nakshatra: number; // 0 = Ashwini
  nakshatraName: string;
  pada: number; // 1–4
  nakLord: Graha;
  navamsa: number; // D9 sign
};

export function pointInfo(lon: number): PointInfo {
  const sign = Math.floor(lon / 30);
  const nak = Math.floor(lon / NAK);
  return {
    lon,
    sign,
    signName: RASHIS[sign],
    degInSign: lon - sign * 30,
    nakshatra: nak,
    nakshatraName: NAKSHATRAS[nak],
    pada: Math.floor((lon % NAK) / (NAK / 4)) + 1,
    nakLord: DASHA_ORDER[nak % 9],
    navamsa: Math.floor((lon * 9) / 30) % 12,
  };
}

export type PlanetPos = PointInfo & { graha: Graha; retro: boolean; speed: number };

export function planetPositions(d: Date): PlanetPos[] {
  return GRAHAS.map((g) => {
    const speed = dailyMotion(g, d);
    return { graha: g, ...pointInfo(siderealLongitude(g, d)), speed, retro: g === 'Rahu' || g === 'Ketu' ? true : speed < 0 };
  });
}

export const fmtDeg = (deg: number) => {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.floor((mFloat - m) * 60);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(2, '0')}″`;
};

/**
 * Find when a continuous angular function crosses `target` (deg) after `start`, within `maxDays`.
 * Scans in `stepHours` steps then bisects to ~1 minute.
 */
export function findCrossing(fn: (d: Date) => number, start: Date, target: number, maxDays: number, stepHours = 2): Date | null {
  const rel = (d: Date) => {
    let x = norm(fn(d) - target);
    if (x > 180) x -= 360;
    return x; // negative before crossing, positive after
  };
  let t0 = start.getTime();
  let v0 = rel(start);
  const end = t0 + maxDays * 86400000;
  const step = stepHours * 3600000;
  while (t0 < end) {
    const t1 = t0 + step;
    const v1 = rel(new Date(t1));
    if (v0 < 0 && v1 >= 0 && v1 - v0 < 90) {
      let lo = t0, hi = t1;
      while (hi - lo > 60000) {
        const mid = (lo + hi) / 2;
        if (rel(new Date(mid)) < 0) lo = mid; else hi = mid;
      }
      return new Date(hi);
    }
    t0 = t1;
    v0 = v1;
  }
  return null;
}

export { A };
