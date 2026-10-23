import { HttpError } from './server-utils';
import { slugify } from './entities';

/** Validate the editable astrologer profile fields. Prices arrive in rupees, stored in paise. */
export function astroData(b: Record<string, unknown>) {
  const d: Record<string, unknown> = {};
  const str = (k: string, max = 200) => { if (typeof b[k] === 'string') d[k] = (b[k] as string).trim().slice(0, max); };
  str('displayName', 80); str('bio', 3000); str('skills'); str('languages'); str('qualification', 120); str('gender', 20); str('city', 80); str('avatar', 300);
  if (typeof b.slug === 'string' || typeof b.displayName === 'string') {
    const s = slugify(String(b.slug || b.displayName || ''));
    if (s) d.slug = s;
  }
  if (d.displayName === '') throw new HttpError(400, 'Display name is required.');
  const int = (k: string, min: number, max: number, label: string) => {
    if (b[k] === undefined || b[k] === '') return;
    const n = Number(b[k]);
    if (!Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `${label} must be between ${min} and ${max}.`);
    d[k] = Math.round(n);
  };
  int('experience', 0, 80, 'Experience');
  int('freeMinutes', 0, 30, 'Free minutes');
  int('commission', 0, 90, 'Commission %');
  for (const k of ['chatPrice', 'callPrice', 'videoPrice']) {
    if (b[k] === undefined || b[k] === '') continue;
    const n = Number(b[k]);
    if (!Number.isFinite(n) || n < 1 || n > 1000) throw new HttpError(400, 'Per-minute prices must be between ₹1 and ₹1000.');
    d[k] = Math.round(n * 100);
  }
  for (const k of ['isChat', 'isCall', 'isVideo', 'featured']) if (typeof b[k] === 'boolean') d[k] = b[k];
  if (d.avatar === '') d.avatar = null;
  return d;
}
