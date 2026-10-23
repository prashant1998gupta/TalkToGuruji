// Timezone helpers built on Intl so historical offsets (e.g. India's 1942–45 war time) are respected.

function partsIn(tz: string, ms: number) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, s: +p.second };
}

/** Offset of `tz` from UTC at instant `ms`, in minutes. */
export function tzOffsetMinutes(tz: string, ms: number) {
  const p = partsIn(tz, ms);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** Wall-clock date ("YYYY-MM-DD") + time ("HH:mm") in `tz` → UTC Date. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = (time || '12:00').split(':').map(Number);
  const guess = Date.UTC(y, m - 1, d, h, mi);
  let off = tzOffsetMinutes(tz, guess);
  let utc = guess - off * 60000;
  const off2 = tzOffsetMinutes(tz, utc); // second pass handles DST boundaries
  if (off2 !== off) { off = off2; utc = guess - off * 60000; }
  return new Date(utc);
}

export const fmtTime = (d: Date | null | undefined, tz: string) =>
  d ? d.toLocaleTimeString('en-IN', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

export const fmtDateTz = (d: Date, tz: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  d.toLocaleDateString('en-IN', { timeZone: tz, ...opts });

export const fmtDateTimeTz = (d: Date | null | undefined, tz: string) =>
  d ? d.toLocaleString('en-IN', { timeZone: tz, day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '—';

/** Today's date string (YYYY-MM-DD) in a timezone. */
export function todayIn(tz: string) {
  const p = partsIn(tz, Date.now());
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

export const formatOffset = (min: number) => `${min < 0 ? '-' : '+'}${String(Math.floor(Math.abs(min) / 60)).padStart(2, '0')}:${String(Math.abs(min) % 60).padStart(2, '0')}`;
