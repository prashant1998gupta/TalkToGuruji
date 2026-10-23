/** Daily Panchang for a date and place. */
import { INAUSPICIOUS_YOGAS, KARANAS_MOVABLE, MASAS, NAKSHATRAS, RASHIS, RITUS, TITHIS, VARAS, YOGAS, DASHA_ORDER } from './constants';
import { A, findCrossing, lahiriAyanamsa, norm, siderealLongitude } from './engine';
import { zonedToUtc } from './time';

const NAK = 360 / 27;

const elongation = (d: Date) => norm(A.EclipticGeoMoon(d).lon - A.SunPosition(d).elon);
const moonSid = (d: Date) => siderealLongitude('Moon', d);
const yogaSum = (d: Date) => norm(siderealLongitude('Sun', d) + siderealLongitude('Moon', d));

export type Span = { name: string; ends: Date | null; extra?: string };

function tithiName(i: number) {
  // i: 0..29
  if (i === 14) return 'Purnima';
  if (i === 29) return 'Amavasya';
  return TITHIS[i % 15];
}

function karanaName(k: number) {
  // k: 0..59 half-tithis from Shukla Pratipada
  if (k === 0) return 'Kimstughna';
  if (k === 57) return 'Shakuni';
  if (k === 58) return 'Chatushpada';
  if (k === 59) return 'Naga';
  return KARANAS_MOVABLE[(k - 1) % 7];
}

export function computePanchang(date: string, lat: number, lon: number, tz: string) {
  const observer = new A.Observer(lat, lon, 0);
  const midnight = zonedToUtc(date, '00:00', tz);
  const sunrise = A.SearchRiseSet(A.Body.Sun, observer, +1, midnight, 1)?.date ?? null;
  const sunset = A.SearchRiseSet(A.Body.Sun, observer, -1, sunrise ?? midnight, 1)?.date ?? null;
  const nextSunrise = sunrise ? A.SearchRiseSet(A.Body.Sun, observer, +1, new Date(sunrise.getTime() + 3600000), 2)?.date ?? null : null;
  const moonrise = A.SearchRiseSet(A.Body.Moon, observer, +1, midnight, 1)?.date ?? null;
  const moonset = A.SearchRiseSet(A.Body.Moon, observer, -1, midnight, 1)?.date ?? null;

  // Panchang elements are those prevailing at sunrise.
  const t = sunrise ?? new Date(midnight.getTime() + 6 * 3600000);

  const el = elongation(t);
  const tIdx = Math.floor(el / 12);
  const tithiEnd = A.SearchMoonPhase(((tIdx + 1) * 12) % 360, t, 3)?.date ?? null;
  const tithi2 = tithiEnd && nextSunrise && tithiEnd < nextSunrise ? tithiName((tIdx + 1) % 30) : null;

  const mLon = moonSid(t);
  const nIdx = Math.floor(mLon / NAK);
  const nakEnd = findCrossing(moonSid, t, ((nIdx + 1) * NAK) % 360, 2, 1);

  const ySum = yogaSum(t);
  const yIdx = Math.floor(ySum / NAK);
  const yogaEnd = findCrossing(yogaSum, t, ((yIdx + 1) * NAK) % 360, 2, 1);

  const kIdx = Math.floor(el / 6);
  const karanaEnd = A.SearchMoonPhase(((kIdx + 1) * 6) % 360, t, 2)?.date ?? null;

  // Weekday at sunrise in local time
  const localDay = new Date(t.toLocaleString('en-US', { timeZone: tz })).getDay();

  // Day divisions
  const dayMs = sunrise && sunset ? sunset.getTime() - sunrise.getTime() : 12 * 3600000;
  const part = (n: number) => (sunrise ? { start: new Date(sunrise.getTime() + (n - 1) * (dayMs / 8)), end: new Date(sunrise.getTime() + n * (dayMs / 8)) } : null);
  const RAHU = [8, 2, 7, 5, 6, 4, 3];
  const YAMA = [5, 4, 3, 2, 1, 7, 6];
  const GULI = [7, 6, 5, 4, 3, 2, 1];
  const noon = sunrise ? new Date(sunrise.getTime() + dayMs / 2) : null;
  const abhijit = noon ? { start: new Date(noon.getTime() - dayMs / 30), end: new Date(noon.getTime() + dayMs / 30) } : null;
  const brahma = sunrise ? { start: new Date(sunrise.getTime() - 96 * 60000), end: new Date(sunrise.getTime() - 48 * 60000) } : null;

  // Lunar month (amanta): Sun's sidereal sign at the preceding new moon
  const lastNewMoon = A.SearchMoonPhase(0, new Date(t.getTime() - 31 * 86400000), 32);
  let masa = '';
  if (lastNewMoon) {
    // the search may land on the new moon before the latest one; walk forward to the latest before t
    let nm = lastNewMoon.date;
    const nxt = A.SearchMoonPhase(0, new Date(nm.getTime() + 86400000), 32)?.date;
    if (nxt && nxt <= t) nm = nxt;
    const sunSign = Math.floor(siderealLongitude('Sun', nm) / 30);
    masa = MASAS[(sunSign + 1) % 12];
  }
  const masaIdx = MASAS.indexOf(masa);
  const [gy, gm] = date.split('-').map(Number);
  // New samvat starts with Chaitra; Jan–Apr dates still in Margashirsha..Phalguna belong to the previous year
  const beforeNewYear = gm <= 4 && masaIdx >= 8;
  const vikram = beforeNewYear ? gy + 56 : gy + 57;

  // Hora (planetary hours): 12 day + 12 night divisions, starting with the weekday lord, Chaldean order
  const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  const DAY_LORD = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const horas: { lord: string; start: Date; end: Date; day: boolean }[] = [];
  if (sunrise && sunset && nextSunrise) {
    let li = CHALDEAN.indexOf(DAY_LORD[localDay]);
    const nightMs = nextSunrise.getTime() - sunset.getTime();
    for (let i = 0; i < 24; i++) {
      const day = i < 12;
      const len = (day ? dayMs : nightMs) / 12;
      const base = day ? sunrise.getTime() : sunset.getTime();
      const k = day ? i : i - 12;
      horas.push({ lord: CHALDEAN[li % 7], start: new Date(base + k * len), end: new Date(base + (k + 1) * len), day });
      li++;
    }
  }

  const sunSid = siderealLongitude('Sun', t);
  return {
    horas,
    date,
    tz,
    sunrise, sunset, moonrise, moonset,
    vara: VARAS[localDay],
    tithi: { name: tithiName(tIdx), paksha: tIdx < 15 ? 'Shukla' : 'Krishna', number: (tIdx % 15) + 1, ends: tithiEnd, next: tithi2 },
    nakshatra: { name: NAKSHATRAS[nIdx], lord: DASHA_ORDER[nIdx % 9], pada: Math.floor((mLon % NAK) / (NAK / 4)) + 1, ends: nakEnd },
    yoga: { name: YOGAS[yIdx], auspicious: !INAUSPICIOUS_YOGAS.has(YOGAS[yIdx]), ends: yogaEnd },
    karana: { name: karanaName(kIdx), ends: karanaEnd },
    moonSign: RASHIS[Math.floor(mLon / 30)],
    sunSign: RASHIS[Math.floor(sunSid / 30)],
    masa,
    ritu: RITUS[Math.floor(((Math.floor(sunSid / 30) + 1) % 12) / 2)],
    vikramSamvat: vikram,
    shakaSamvat: gy - 78 - (beforeNewYear ? 1 : 0),
    ayanamsa: lahiriAyanamsa(t),
    rahuKaal: part(RAHU[localDay]),
    yamaganda: part(YAMA[localDay]),
    gulika: part(GULI[localDay]),
    abhijit: localDay === 3 ? null : abhijit, // Abhijit is not observed on Wednesdays
    brahmaMuhurta: brahma,
    dayLengthMin: Math.round(dayMs / 60000),
  };
}

export type Panchang = ReturnType<typeof computePanchang>;
