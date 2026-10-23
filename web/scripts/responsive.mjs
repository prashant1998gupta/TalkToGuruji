// Responsive audit across device sizes.
// Usage: node scripts/responsive.mjs [outDir] [--shots]   (server must be running on BASE, default http://localhost:3000)
// Reports per page/viewport: horizontal page overflow, elements sticking out of the viewport,
// and (on touch sizes) tap targets smaller than 32px. --shots saves full-page screenshots.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : './responsive-out';
const SHOTS = process.argv.includes('--shots');
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;

const DEVICES = [
  { name: 'phone-320', width: 320, height: 640, mobile: true },
  { name: 'phone-375', width: 375, height: 812, mobile: true },
  { name: 'phone-414', width: 414, height: 896, mobile: true },
  { name: 'tablet-768', width: 768, height: 1024, mobile: true },
  { name: 'tablet-1024', width: 1024, height: 768, mobile: true },
  { name: 'laptop-1280', width: 1280, height: 800, mobile: false },
  { name: 'desktop-1440', width: 1440, height: 900, mobile: false },
  { name: 'wide-1920', width: 1920, height: 1080, mobile: false },
];

const PUBLIC = [
  '/', '/login', '/astrology-services', '/astrology-services/chat-with-astrologer', '/astrology-services/talk-to-astrologer',
  '/astrology-services/live-astrologers', '/astrologer/acharya-raghav-shastri', '/astrology-services/free-kundli',
  '/astrology-services/free-kundli?name=Asha&gender=Female&date=1992-03-14&time=08:20&place=Jaipur',
  '/astrology-services/kundli-matching', '/astrology-services/panchang', '/transits', '/horoscope', '/horoscope/daily',
  '/horoscope/daily/aries', '/horoscope/weekly/pisces', '/blogs', '/blogs/astrological-remedies-for-reducing-debts', '/astrology-news',
  '/rituals', '/rituals/festivals', '/rituals/aarti', '/remedies', '/remedies/sun-remedies', '/vastu', '/tarot', '/tarot/the-fool-tarot-card',
  '/numerology', '/videos', '/web-stories', '/photo-gallery', '/astrology-services/online-pooja-booking', '/puja/mangal-dosh-nivaran-pooja',
  '/astro-mart', '/astro-mart/product/emerald', '/about-us', '/contact-us', '/terms-and-conditions', '/live-aarti-darshan', '/astro-registration',
  '/no-such-page',
];
const USER = ['/wallet', '/account', '/account/consultations', '/account/transactions', '/account/orders', '/notifications', '/cart', '/checkout'];
const ASTRO = ['/astrologer-panel', '/astrologer-panel/sessions', '/astrologer-panel/earnings', '/astrologer-panel/profile', '/astrologer-panel/reviews'];
const ADMIN = ['/admin', '/admin/users', '/admin/astrologers', '/admin/consultations', '/admin/finance', '/admin/content', '/admin/pujas', '/admin/bookings', '/admin/orders', '/admin/mart', '/admin/content/new?type=blog', '/admin/horoscope', '/admin/site', '/admin/settings'];

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
await fs.mkdir(OUT, { recursive: true });

// one logged-in storage state per role (OTP sends are rate limited per phone, so do it once)
async function storage(phone) {
  if (!phone) return undefined;
  const ctx = await browser.newContext();
  const s = await (await ctx.request.post(`${BASE}/api/auth/otp/send`, { data: { phone } })).json();
  if (!s.devCode) throw new Error(`OTP for ${phone}: ${JSON.stringify(s)}`);
  const v = await ctx.request.post(`${BASE}/api/auth/otp/verify`, { data: { phone, code: s.devCode } });
  if (!v.ok()) throw new Error(`verify ${phone} failed`);
  if (phone === '9876543210') await ctx.request.post(`${BASE}/api/cart`, { data: { productId: await firstProductId(ctx), qty: 1 } }).catch(() => {});
  const st = await ctx.storageState();
  await ctx.close();
  return st;
}
async function firstProductId(ctx) {
  const html = await (await ctx.request.get(`${BASE}/astro-mart/product/panchmukhi-rudraksha`)).text();
  return (html.match(/"productId":"([^"]+)"|data-product-id="([^"]+)"/) || [])[1];
}

const groups = [
  { role: 'guest', phone: null, pages: PUBLIC },
  { role: 'user', phone: '9876543210', pages: USER },
  { role: 'astro', phone: '9000000002', pages: ASTRO },
  { role: 'admin', phone: '9999999999', pages: ADMIN },
];

const audit = () => {
  const vw = document.documentElement.clientWidth;
  const out = { pageOverflow: document.documentElement.scrollWidth - vw, offenders: [], smallTargets: [] };
  const clipped = (el) => {
    // ignore elements inside a horizontally scrollable/clipped ancestor (carousels, tables in scroll boxes)
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true;
    }
    return false;
  };
  const label = (el) => {
    const id = el.id ? '#' + el.id : '';
    const cls = typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
    const txt = (el.innerText || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls}${txt ? ` "${txt}"` : ''}`;
  };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) out.offenders.push(`${label(el)} [${Math.round(r.left)}→${Math.round(r.right)}]`);
  }
  if (matchMedia('(pointer: coarse)').matches) {
    for (const el of document.querySelectorAll('a, button, input, select, textarea, [role=button]')) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (!r.width || cs.visibility === 'hidden' || el.closest('nav[aria-label=Breadcrumb], footer, .prose-guru, p, li li')) continue;
      if (el.tagName === 'A' && cs.display === 'inline') continue; // inline text links
      if (r.height < 32 && r.width < 32) out.smallTargets.push(label(el));
    }
  }
  out.offenders = [...new Set(out.offenders)].slice(0, 6);
  out.smallTargets = [...new Set(out.smallTargets)].slice(0, 6);
  return out;
};

const report = [];
for (const g of groups) {
  const state = await storage(g.phone);
  // devices run 4 at a time to keep the audit to a few minutes
  const runDevice = async (d) => {
    const ctx = await browser.newContext({ storageState: state, viewport: { width: d.width, height: d.height }, isMobile: d.mobile, hasTouch: d.mobile, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    for (const p of g.pages) {
      if (ONLY && !ONLY.test(p)) continue;
      try {
        const res = await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(400);
        const a = await page.evaluate(audit);
        const status = res?.status();
        const issue = a.pageOverflow > 1 || a.offenders.length || a.smallTargets.length || errors.length || (status !== 200 && p !== '/no-such-page');
        if (issue) report.push({ device: d.name, role: g.role, page: p, status, ...a, errors: [...errors] });
        if (SHOTS && ['phone-375', 'tablet-768', 'desktop-1440'].includes(d.name)) {
          const file = `${OUT}/${d.name}__${g.role}__${p.replace(/[\/?=&:]+/g, '_').slice(0, 80) || 'home'}.png`;
          await page.screenshot({ path: file, fullPage: true }).catch(() => {});
        }
        errors.length = 0;
      } catch (e) {
        report.push({ device: d.name, role: g.role, page: p, error: e.message.split('\n')[0] });
      }
    }
    await ctx.close();
    process.stdout.write(`${g.role} ${d.name} done\n`);
  };
  for (let i = 0; i < DEVICES.length; i += 4) await Promise.all(DEVICES.slice(i, i + 4).map(runDevice));
}
await browser.close();
await fs.writeFile(`${OUT}/report.json`, JSON.stringify(report, null, 1));

// compact summary grouped by page
const byPage = {};
for (const r of report) (byPage[r.page] ??= []).push(r);
for (const [p, rows] of Object.entries(byPage)) {
  console.log(`\n## ${p}`);
  for (const r of rows) {
    const bits = [];
    if (r.error) bits.push('ERROR ' + r.error);
    if (r.status && r.status !== 200) bits.push('status ' + r.status);
    if (r.pageOverflow > 1) bits.push(`page scrolls sideways by ${r.pageOverflow}px`);
    if (r.offenders?.length) bits.push('sticks out: ' + r.offenders.join(' | '));
    if (r.smallTargets?.length) bits.push('small tap targets: ' + r.smallTargets.join(' | '));
    if (r.errors?.length) bits.push('JS errors: ' + r.errors.join(' | '));
    console.log(`- ${r.device} (${r.role}): ${bits.join(' ; ')}`);
  }
}
console.log(`\n${report.length} issue rows across ${Object.keys(byPage).length} pages`);
