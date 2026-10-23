// Screenshots of consultation/money pages at desktop and phone widths.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.argv[2] || './shots';
await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });

async function ctxFor(phone, viewport) {
  const ctx = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  if (phone) {
    const s = await (await ctx.request.post(`${BASE}/api/auth/otp/send`, { data: { phone } })).json();
    if (!s.devCode) throw new Error(JSON.stringify(s));
    await ctx.request.post(`${BASE}/api/auth/otp/verify`, { data: { phone, code: s.devCode } });
  }
  return ctx;
}

const pages = {
  user: ['/astrology-services/chat-with-astrologer', '/astrology-services/live-astrologers', '/astrologer/pt-meera-joshi', '/wallet', '/account', '/account/consultations', '/account/transactions', '/notifications'],
  astro: ['/astrologer-panel', '/astrologer-panel/sessions', '/astrologer-panel/earnings', '/astrologer-panel/profile'],
  applicant: ['/astro-registration'],
};
const phones = { user: '9876543210', astro: '9000000002', applicant: '9811111111' };

for (const [who, list] of Object.entries(pages)) {
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const ctx = await ctxFor(phones[who], vp);
    const p = await ctx.newPage();
    for (const path of list) {
      try {
        await p.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
        await p.waitForTimeout(600);
        const name = `${who}${path.replace(/\//g, '_')}-${vp.width}.png`;
        await p.screenshot({ path: `${OUT}/${name}`, fullPage: true });
        const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        console.log('ok', name, overflow ? 'HORIZONTAL OVERFLOW' : '');
      } catch (e) { console.log('fail', path, vp.width, e.message.split('\n')[0]); }
    }
    await ctx.close();
    await new Promise((r) => setTimeout(r, 31000)); // OTP resend limit per phone
  }
}
await browser.close();
