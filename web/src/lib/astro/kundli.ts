/** Full birth chart (Janam Kundli): positions, houses, avakhada, dashas, doshas and gemstones. */
import {
  DASHA_ORDER, DASHA_YEARS, DEBILITATION, EXALTATION, GANA, GEMSTONE, NAME_SYLLABLES, RASHIS, SIGN_LORD, TATVA, VASHYA_BY_SIGN, YONI,
  nadiOf, varnaOf, type Graha,
} from './constants';
import { ascendant, planetPositions, pointInfo, siderealLongitude, type PlanetPos, type PointInfo } from './engine';
import { zonedToUtc, tzOffsetMinutes } from './time';

export type BirthInput = { name: string; gender: string; date: string; time: string; place: string; lat: number; lon: number; tz: string };

export type DashaPeriod = { lord: Graha; start: Date; end: Date; sub?: DashaPeriod[] };

const YEAR_MS = 365.2425 * 86400000;

export function vimshottari(moonLon: number, birth: Date): DashaPeriod[] {
  const nakLen = 360 / 27;
  const nak = Math.floor(moonLon / nakLen);
  const traversed = (moonLon % nakLen) / nakLen;
  const first = nak % 9;
  const out: DashaPeriod[] = [];
  // Start of the running mahadasha at birth is in the past.
  let cursor = birth.getTime() - traversed * DASHA_YEARS[DASHA_ORDER[first]] * YEAR_MS;
  for (let i = 0; i < 9; i++) {
    const lord = DASHA_ORDER[(first + i) % 9];
    const len = DASHA_YEARS[lord] * YEAR_MS;
    const md: DashaPeriod = { lord, start: new Date(cursor), end: new Date(cursor + len), sub: [] };
    let sc = cursor;
    for (let j = 0; j < 9; j++) {
      const sl = DASHA_ORDER[(first + i + j) % 9];
      const sLen = (len * DASHA_YEARS[sl]) / 120;
      md.sub!.push({ lord: sl, start: new Date(sc), end: new Date(sc + sLen) });
      sc += sLen;
    }
    out.push(md);
    cursor += len;
  }
  return out;
}

export function currentDasha(dashas: DashaPeriod[], at = new Date()) {
  const md = dashas.find((d) => d.start <= at && at < d.end);
  const ad = md?.sub?.find((d) => d.start <= at && at < d.end);
  return { md, ad };
}

function dignity(g: Graha, sign: number) {
  if (EXALTATION[g] === sign) return 'Exalted';
  if (DEBILITATION[g] === sign) return 'Debilitated';
  if (g !== 'Rahu' && g !== 'Ketu' && SIGN_LORD[sign] === g) return 'Own sign';
  return '';
}

export type Kundli = ReturnType<typeof computeKundli>;

export function computeKundli(input: BirthInput) {
  const utc = zonedToUtc(input.date, input.time, input.tz);
  const ascLon = ascendant(utc, input.lat, input.lon);
  const asc = pointInfo(ascLon);
  const planets = planetPositions(utc).map((p) => ({ ...p, house: ((p.sign - asc.sign + 12) % 12) + 1, dignity: dignity(p.graha, p.sign) }));
  const P = Object.fromEntries(planets.map((p) => [p.graha, p])) as Record<Graha, PlanetPos & { house: number; dignity: string }>;
  const moon = P.Moon;

  // houses: whole-sign, house 1 = lagna sign
  const houses = Array.from({ length: 12 }, (_, i) => {
    const sign = (asc.sign + i) % 12;
    return { house: i + 1, sign, lord: SIGN_LORD[sign], planets: planets.filter((p) => p.sign === sign).map((p) => p.graha) };
  });
  const navamsaHouses = Array.from({ length: 12 }, (_, i) => {
    const sign = (asc.navamsa + i) % 12;
    return { house: i + 1, sign, planets: planets.filter((p) => p.navamsa === sign).map((p) => p.graha) };
  });

  const avakhada = {
    ascendant: RASHIS[asc.sign],
    ascendantLord: SIGN_LORD[asc.sign],
    rashi: RASHIS[moon.sign],
    rashiLord: SIGN_LORD[moon.sign],
    sunSign: RASHIS[P.Sun.sign],
    nakshatra: `${moon.nakshatraName} (pada ${moon.pada})`,
    nakshatraLord: moon.nakLord,
    varna: varnaOf(moon.sign),
    vashya: VASHYA_BY_SIGN[moon.sign],
    yoni: YONI[moon.nakshatra],
    gana: GANA[moon.nakshatra],
    nadi: nadiOf(moon.nakshatra),
    tatva: TATVA[moon.sign % 4],
    nameSyllable: NAME_SYLLABLES[moon.nakshatra][moon.pada - 1],
  };

  const dashas = vimshottari(moon.lon, utc);

  return {
    input,
    utc,
    tzOffset: tzOffsetMinutes(input.tz, utc.getTime()),
    ascendant: asc,
    planets: planets as (PlanetPos & { house: number; dignity: string })[],
    houses,
    navamsaHouses,
    avakhada,
    dashas,
    current: currentDasha(dashas),
    doshas: { manglik: manglik(P.Mars, asc, moon), kaalSarp: kaalSarp(planets), sadeSati: sadeSati(moon.sign) },
    gemstones: gemstones(asc.sign),
  };
}

// ---------- Doshas ----------

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

export function manglik(mars: PointInfo, asc: PointInfo, moon: PointInfo) {
  const fromLagna = ((mars.sign - asc.sign + 12) % 12) + 1;
  const fromMoon = ((mars.sign - moon.sign + 12) % 12) + 1;
  const lagnaHit = MANGLIK_HOUSES.includes(fromLagna);
  const moonHit = MANGLIK_HOUSES.includes(fromMoon);
  // Classical cancellations: Mars in own sign or exaltation
  const cancelled = (lagnaHit || moonHit) && [0, 7, 9].includes(mars.sign);
  const present = (lagnaHit || moonHit) && !cancelled;
  const level = !present ? 'none' : lagnaHit && moonHit ? 'high' : 'low';
  return {
    present, level, fromLagna, fromMoon, cancelled,
    summary: !present
      ? cancelled
        ? `Mars is in ${RASHIS[mars.sign]}, its own/exalted sign, which cancels Mangal dosha.`
        : 'Mars is not in the 1st, 2nd, 4th, 7th, 8th or 12th house from the lagna or Moon — no Mangal dosha.'
      : `Mars is in house ${fromLagna} from the lagna and house ${fromMoon} from the Moon. ${level === 'high' ? 'Dosha is present from both — consult before marriage.' : 'Mild (anshik) Mangal dosha.'}`,
  };
}

export function kaalSarp(planets: PlanetPos[]) {
  const rahu = planets.find((p) => p.graha === 'Rahu')!.lon;
  const seven = planets.filter((p) => p.graha !== 'Rahu' && p.graha !== 'Ketu').map((p) => (p.lon - rahu + 360) % 360);
  const oneSide = seven.every((x) => x < 180) || seven.every((x) => x > 180);
  return {
    present: oneSide,
    summary: oneSide
      ? 'All seven grahas are hemmed between Rahu and Ketu — Kaal Sarp yoga is present. Remedies like Kaal Sarp puja can help.'
      : 'Planets fall on both sides of the Rahu–Ketu axis — no Kaal Sarp dosha.',
  };
}

/** Sade Sati: Saturn transiting the 12th, 1st or 2nd sign from the natal Moon. */
export function sadeSati(moonSign: number, at = new Date()) {
  const satSign = Math.floor(siderealLongitude('Saturn', at) / 30);
  const rel = (satSign - moonSign + 12) % 12;
  const phase = rel === 11 ? 'Rising (first) phase' : rel === 0 ? 'Peak (second) phase' : rel === 1 ? 'Setting (third) phase' : null;
  const dhaiya = rel === 3 || rel === 7 ? `Shani Dhaiya (Saturn in the ${rel + 1}th from the Moon)` : null;
  return {
    present: !!phase,
    phase,
    dhaiya,
    saturnSign: RASHIS[satSign],
    summary: phase
      ? `Saturn is transiting ${RASHIS[satSign]}, the ${rel === 11 ? '12th' : rel === 0 ? '1st' : '2nd'} sign from your Moon — Sade Sati ${phase.toLowerCase()} is running.`
      : `Saturn is in ${RASHIS[satSign]} — Sade Sati is not active for your Moon sign.${dhaiya ? ` ${dhaiya} is running.` : ''}`,
  };
}

function gemstones(ascSign: number) {
  const life = SIGN_LORD[ascSign];
  const lucky = SIGN_LORD[(ascSign + 4) % 12];
  const fortune = SIGN_LORD[(ascSign + 8) % 12];
  return [
    { role: 'Life stone', why: 'Lord of the ascendant', planet: life, ...GEMSTONE[life] },
    { role: 'Lucky stone', why: 'Lord of the 5th house', planet: lucky, ...GEMSTONE[lucky] },
    { role: 'Fortune stone', why: 'Lord of the 9th house', planet: fortune, ...GEMSTONE[fortune] },
  ];
}
