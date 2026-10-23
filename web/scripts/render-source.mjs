// One-off: render client-side pages of the old site and save their main text.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const OUT = '../_source/rendered';
const pages = process.argv.length > 2 ? process.argv.slice(2) : ['about-us', 'terms-and-conditions', 'privacy-policy', 'refund-policy', 'astrologer-terms-and-condition', 'contact-us', 'subscription-plan', 'transits', 'live-aarti-darshan', 'live-temple-darshan', 'astro-registration', 'astrology-services/online-pooja-booking', 'astrology-services', 'astrology-services/free-kundli', 'astrology-services/kundli-matching', 'astrology-services/Panchang', 'astrology-services/talk-to-astrologer', 'astrology-services/online-katha-booking', 'remedies/sun-remedies', 'rituals/vrats'];

await fs.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true });
const page = await browser.newPage();
for (const p of pages) {
  try {
    await page.goto(`https://talktoguruji.com/${p}`, { waitUntil: 'networkidle', timeout: 45000 });
    const text = await page.evaluate(() => {
      document.querySelectorAll('header, footer, nav, script, style').forEach(e => e.remove());
      return document.body.innerText.replace(/\n{3,}/g, '\n\n').trim();
    });
    await fs.writeFile(`${OUT}/${p.replace(/\//g, '__')}.txt`, text);
    console.log(p, text.length);
  } catch (e) { console.log(p, 'ERR', e.message.split('\n')[0]); }
}
await browser.close();

