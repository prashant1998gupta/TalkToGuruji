// Accuracy check for the astro engine against known reference values.
import { computeKundli } from '../src/lib/astro/kundli';
import { lahiriAyanamsa, fmtDeg } from '../src/lib/astro/engine';

const k = computeKundli({ name: 'Test', gender: 'Male', date: '1990-01-01', time: '12:00', place: 'New Delhi', lat: 28.6139, lon: 77.209, tz: 'Asia/Kolkata' });
console.log('UTC', k.utc.toISOString(), 'offset', k.tzOffset);
console.log('Ayanamsa', lahiriAyanamsa(k.utc).toFixed(4));
console.log('Asc', k.ascendant.signName, fmtDeg(k.ascendant.degInSign), k.ascendant.nakshatraName);
for (const p of k.planets) console.log(p.graha.padEnd(8), p.signName.padEnd(12), fmtDeg(p.degInSign).padEnd(12), p.nakshatraName, p.pada, p.retro ? 'R' : '', 'H' + p.house);
console.log('Current dasha', k.current.md?.lord, k.current.ad?.lord);
console.log('First MD', k.dashas[0].lord, k.dashas[0].end.toISOString().slice(0, 10));
console.log(k.avakhada);
console.log(k.doshas.manglik.summary);

// Panchang check: 2024-01-22 (Ram Mandir pran-pratishtha) New Delhi — known: Paush Shukla Dwadashi, Mrigashira nakshatra, Monday
import { computePanchang } from '../src/lib/astro/panchang';
import { fmtTime } from '../src/lib/astro/time';
const p = computePanchang('2024-01-22', 28.6139, 77.209, 'Asia/Kolkata');
console.log('Panchang 2024-01-22', p.vara, '|', p.tithi.paksha, p.tithi.name, 'ends', fmtTime(p.tithi.ends, p.tz), '|', p.nakshatra.name, 'ends', fmtTime(p.nakshatra.ends, p.tz), '|', p.yoga.name, '|', p.karana.name, '| masa', p.masa, '| sunrise', fmtTime(p.sunrise, p.tz), 'sunset', fmtTime(p.sunset, p.tz), '| rahu', fmtTime(p.rahuKaal!.start, p.tz), '-', fmtTime(p.rahuKaal!.end, p.tz), '| VS', p.vikramSamvat);

import { matchCharts } from '../src/lib/astro/matching';
const m = matchCharts(
  { name: 'Boy', gender: 'Male', date: '1990-01-01', time: '12:00', place: 'Delhi', lat: 28.61, lon: 77.21, tz: 'Asia/Kolkata' },
  { name: 'Girl', gender: 'Female', date: '1992-06-15', time: '08:30', place: 'Mumbai', lat: 19.08, lon: 72.88, tz: 'Asia/Kolkata' },
);
console.log('Match', m.total, m.verdict.label, m.kootas.map((k) => `${k.name}:${k.score}`).join(' '));

import { upcomingIngresses } from '../src/lib/astro/transits';
const t0 = Date.now();
const ing = upcomingIngresses(365);
console.log('Ingresses', ing.length, 'in', Date.now() - t0, 'ms; first', ing.slice(0, 3).map((i) => `${i.graha} ${i.from}->${i.to} ${i.date.toISOString().slice(0, 10)}`).join('; '));
