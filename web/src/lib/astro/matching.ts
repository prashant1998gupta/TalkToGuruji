/** Ashtakoot Guna Milan (36 points) between a boy's and a girl's charts. */
import { FRIENDS, GANA, NAKSHATRAS, RASHIS, SIGN_LORD, VASHYA_BY_SIGN, VASHYA_GROUPS, YONI, YONI_ENEMIES, nadiOf, varnaOf, type Graha } from './constants';
import { computeKundli, type BirthInput } from './kundli';

const VARNA_RANK: Record<string, number> = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };

// rows = boy, cols = girl, order of VASHYA_GROUPS
const VASHYA_TABLE = [
  [2, 1, 1, 0.5, 1],
  [1, 2, 0.5, 0, 1],
  [1, 0.5, 2, 1, 1],
  [0.5, 0, 1, 2, 0],
  [1, 1, 1, 0, 2],
];
const GANA_IDX = { Deva: 0, Manushya: 1, Rakshasa: 2 };
const GANA_TABLE = [
  [6, 6, 1],
  [5, 6, 0],
  [1, 0, 6],
];

function relation(a: Graha, b: Graha): 'F' | 'N' | 'E' {
  if (a === b) return 'F';
  const r = FRIENDS[a];
  if (!r) return 'N';
  return r.f.includes(b) ? 'F' : r.e.includes(b) ? 'E' : 'N';
}

function maitriScore(a: Graha, b: Graha) {
  if (a === b) return 5;
  const pair = [relation(a, b), relation(b, a)].sort().join('');
  return ({ FF: 5, FN: 4, NN: 3, EF: 1, EN: 0.5, EE: 0 } as Record<string, number>)[pair] ?? 0;
}

function taraOk(from: number, to: number) {
  const n = ((to - from + 27) % 27) + 1;
  return ![3, 5, 7].includes(n % 9);
}

export type Koota = { name: string; max: number; score: number; boy: string; girl: string; meaning: string };

export function matchCharts(boyIn: BirthInput, girlIn: BirthInput) {
  const boy = computeKundli(boyIn);
  const girl = computeKundli(girlIn);
  const bm = boy.planets.find((p) => p.graha === 'Moon')!;
  const gm = girl.planets.find((p) => p.graha === 'Moon')!;

  const bVarna = varnaOf(bm.sign), gVarna = varnaOf(gm.sign);
  const bVashya = VASHYA_BY_SIGN[bm.sign], gVashya = VASHYA_BY_SIGN[gm.sign];
  const bYoni = YONI[bm.nakshatra], gYoni = YONI[gm.nakshatra];
  const bLord = SIGN_LORD[bm.sign], gLord = SIGN_LORD[gm.sign];
  const bGana = GANA[bm.nakshatra], gGana = GANA[gm.nakshatra];
  const bNadi = nadiOf(bm.nakshatra), gNadi = nadiOf(gm.nakshatra);
  const dist = ((bm.sign - gm.sign + 12) % 12) + 1; // boy's sign counted from girl's
  const badBhakoot = [2, 12, 6, 8, 5, 9].includes(dist);

  const taraScore = (taraOk(gm.nakshatra, bm.nakshatra) ? 1.5 : 0) + (taraOk(bm.nakshatra, gm.nakshatra) ? 1.5 : 0);
  const yoniEnemy = YONI_ENEMIES.some(([a, b]) => (a === bYoni && b === gYoni) || (b === bYoni && a === gYoni));

  const kootas: Koota[] = [
    { name: 'Varna', max: 1, score: VARNA_RANK[bVarna] >= VARNA_RANK[gVarna] ? 1 : 0, boy: bVarna, girl: gVarna, meaning: 'Spiritual compatibility and ego levels' },
    { name: 'Vashya', max: 2, score: VASHYA_TABLE[VASHYA_GROUPS.indexOf(bVashya)][VASHYA_GROUPS.indexOf(gVashya)], boy: bVashya, girl: gVashya, meaning: 'Mutual attraction and influence over each other' },
    { name: 'Tara', max: 3, score: taraScore, boy: NAKSHATRAS[bm.nakshatra], girl: NAKSHATRAS[gm.nakshatra], meaning: 'Birth-star compatibility, health and wellbeing' },
    { name: 'Yoni', max: 4, score: bYoni === gYoni ? 4 : yoniEnemy ? 0 : 2, boy: bYoni, girl: gYoni, meaning: 'Physical and intimate compatibility' },
    { name: 'Graha Maitri', max: 5, score: maitriScore(bLord, gLord), boy: bLord, girl: gLord, meaning: 'Mental wavelength and friendship of moon-sign lords' },
    { name: 'Gana', max: 6, score: GANA_TABLE[GANA_IDX[bGana]][GANA_IDX[gGana]], boy: bGana, girl: gGana, meaning: 'Temperament — Deva, Manushya or Rakshasa nature' },
    { name: 'Bhakoot', max: 7, score: badBhakoot ? 0 : 7, boy: RASHIS[bm.sign], girl: RASHIS[gm.sign], meaning: 'Family welfare, finances and growth together' },
    { name: 'Nadi', max: 8, score: bNadi === gNadi ? 0 : 8, boy: bNadi, girl: gNadi, meaning: 'Health, genes and progeny' },
  ];
  const total = kootas.reduce((s, k) => s + k.score, 0);

  const bM = boy.doshas.manglik, gM = girl.doshas.manglik;
  const manglikNote =
    bM.present && gM.present ? 'Both are Manglik — the doshas cancel each other out.'
      : !bM.present && !gM.present ? 'Neither partner is Manglik.'
        : `${bM.present ? boyIn.name : girlIn.name} is Manglik and the other is not — remedies are advised before marriage.`;

  const verdict =
    total >= 32 ? { label: 'Excellent match', tone: 'green' as const, text: 'An outstanding union, blessed on almost every count.' }
      : total >= 25 ? { label: 'Very good match', tone: 'green' as const, text: 'Strong compatibility. Marriage is recommended.' }
        : total >= 18 ? { label: 'Average match', tone: 'saffron' as const, text: 'Acceptable compatibility — an astrologer can suggest remedies for weaker areas.' }
          : { label: 'Not recommended', tone: 'red' as const, text: 'Below the traditional 18-guna threshold. Please consult an astrologer before deciding.' };

  return {
    boy: { name: boyIn.name, rashi: RASHIS[bm.sign], nakshatra: `${NAKSHATRAS[bm.nakshatra]} ${bm.pada}`, ascendant: boy.ascendant.signName, manglik: bM },
    girl: { name: girlIn.name, rashi: RASHIS[gm.sign], nakshatra: `${NAKSHATRAS[gm.nakshatra]} ${gm.pada}`, ascendant: girl.ascendant.signName, manglik: gM },
    kootas,
    total,
    verdict,
    manglikNote,
    nadiDosha: bNadi === gNadi,
    bhakootDosha: badBhakoot,
  };
}
