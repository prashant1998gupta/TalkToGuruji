/** Parse birth details from URL search params (shared by kundli & matching pages). */
import { cityById, cityLabel, searchCities } from './cities';
import type { BirthInput } from './kundli';

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export function birthFromParams(sp: SP, prefix = ''): (BirthInput & { cityId: string }) | null {
  const name = one(sp[`${prefix}name`]).trim().slice(0, 60);
  const date = one(sp[`${prefix}date`]);
  const time = one(sp[`${prefix}time`]) || '12:00';
  // ?city=<id> from the form, or free-text ?place=Jaipur (e.g. links from a consultation's intake)
  const place = one(sp[`${prefix}place`]).split(',')[0].trim();
  const city = cityById(one(sp[`${prefix}city`])) || (place ? searchCities(place, 1)[0] : undefined);
  const gender = one(sp[`${prefix}gender`]) || 'Male';
  if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !city) return null;
  const y = +date.slice(0, 4);
  if (y < 1900 || y > 2100) return null;
  return { name, gender, date, time, place: cityLabel(city), lat: city.lat, lon: city.lon, tz: city.tz, cityId: city.id };
}

export function cityOption(id: string | undefined) {
  const c = cityById(id);
  return c ? { id: c.id, label: cityLabel(c), tz: c.tz } : null;
}
