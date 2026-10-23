// Admin-editable site settings (Setting table) with code defaults as fallback.
import { db } from './db';
import { CONTACT } from './nav';

export async function getSettings() {
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, string>;
}

export async function getContact() {
  const s = await getSettings();
  let social = CONTACT.social;
  try { if (s.social) social = { ...social, ...JSON.parse(s.social) }; } catch {}
  return { ...CONTACT, address: s.contact_address || CONTACT.address, email: s.contact_email || CONTACT.email, social };
}

export async function getGstPercent() {
  const v = Number((await db.setting.findUnique({ where: { key: 'gst_percent' } }))?.value);
  return Number.isFinite(v) && v >= 0 && v <= 50 ? v : 18;
}
