// End-to-end check of the consultation flow against a running dev server.
// Usage: node scripts/e2e-consult.mjs [outDir]
// Two browser contexts: a user (9876543210) and an astrologer (9000000001).
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.argv[2] || './e2e-shots';
await fs.mkdir(OUT, { recursive: true });
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const shot = (p, n) => p.screenshot({ path: `${OUT}/${n}.png` }).then(() => log('shot', n));

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || 'msedge', headless: true, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const perms = { permissions: ['microphone', 'camera'] };
const userCtx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...perms });
const astroCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, ...perms });

async function login(ctx, phone) {
  const s = await ctx.request.post(`${BASE}/api/auth/otp/send`, { data: { phone } });
  const sj = await s.json();
  if (!sj.devCode) throw new Error(`OTP send failed for ${phone}: ${JSON.stringify(sj)}`);
  const v = await ctx.request.post(`${BASE}/api/auth/otp/verify`, { data: { phone, code: sj.devCode } });
  if (!v.ok()) throw new Error(`verify failed ${phone}: ${await v.text()}`);
  log('logged in', phone);
}

await login(userCtx, '9876543210');
await login(astroCtx, '9000000001');

const user = await userCtx.newPage();
const astro = await astroCtx.newPage();
for (const [n, p] of [['user', user], ['astro', astro]]) {
  p.on('dialog', (d) => d.accept());
  p.on('pageerror', (e) => log(n, 'PAGEERROR', e.message));
  p.on('console', (m) => (m.type() === 'error' || m.text().startsWith('[rtc]')) && log(n, 'console', m.text().slice(0, 200)));
}

// ---- top up through the test gateway (popular ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹500 pack) ----
async function recharge(tag) {
  await user.goto(`${BASE}/wallet`, { waitUntil: 'networkidle' });
  const before = await user.getByTestId('wallet-balance').innerText();
  await user.getByRole('button', { name: /Proceed to pay/ }).click();
  await user.waitForURL(/\/pay\//, { timeout: 30000, waitUntil: 'commit' }); await user.waitForLoadState('networkidle');
  await shot(user, `30-pay-gateway-${tag}`);
  // a click that lands before hydration is lost in dev mode — retry until the page reacts
  for (let i = 0; i < 6 && !/\/wallet\?paid=1/.test(user.url()); i++) {
    await user.getByTestId('pay-success').click().catch(() => {});
    await user.waitForURL(/\/wallet\?paid=1/, { timeout: 5000, waitUntil: 'commit' }).catch(() => {});
  }
  try {
    await user.waitForURL(/\/wallet\?paid=1/, { timeout: 30000, waitUntil: 'commit' });
  } catch (e) {
    log('stuck on', user.url(), (await user.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 300));
    await shot(user, 'ERR-pay');
    throw e;
  }
  await user.waitForLoadState('networkidle');
  const after = await user.getByTestId('wallet-balance').innerText();
  log('recharge', tag, 'wallet before', before, 'after', after);
}
await recharge('start');

// ---- end any consultation left open by an earlier aborted run ----
{
  const r = await userCtx.request.get(`${BASE}/account/consultations`);
  const open = [...(await r.text()).matchAll(/href="\/consult\/([a-z0-9]+)"/g)].map((m) => m[1]);
  for (const id of new Set(open)) {
    await user.goto(`${BASE}/consult/${id}`, { waitUntil: 'networkidle' });
    const end = user.getByRole('button', { name: /^End$/ }).first();
    if (await end.isVisible().catch(() => false)) { await end.click(); await user.getByText('Consultation complete').waitFor({ timeout: 10000 }).catch(() => {}); log('ended leftover session', id); }
  }
}

// ---- astrologer goes online ----
await astro.goto(`${BASE}/astrologer-panel`, { waitUntil: 'networkidle' });
const toggle = astro.getByTestId('online-toggle');
if ((await toggle.getAttribute('aria-checked')) !== 'true') { await toggle.click(); await astro.waitForTimeout(800); }
log('astro online =', await toggle.getAttribute('aria-checked'));
await shot(astro, '01-astro-dashboard-390');

async function startConsult(mode) {
  await user.goto(`${BASE}/astrologer/acharya-raghav-shastri`, { waitUntil: 'networkidle' });
  await user.waitForTimeout(800);
  await user.getByRole('button', { name: new RegExp(`^${mode}`, 'i') }).first().click();
  const dlg = user.getByRole('dialog');
  await dlg.waitFor();
  // prefilled from profile; make sure required fields have values
  const dob = dlg.locator('input[type=date]');
  if (!(await dob.inputValue())) await dob.fill('1995-08-15');
  const place = dlg.getByPlaceholder('e.g. Jaipur, Rajasthan');
  if (!(await place.inputValue())) await place.fill('New Delhi');
  await shot(user, `10-${mode}-intake`);
  await dlg.getByRole('button', { name: /^Start/ }).click();
  log('requested', mode);
  // astrologer accepts from the global popup
  const pop = astro.getByRole('alertdialog');
  try { await pop.waitFor({ timeout: 15000 }); } catch (e) {
    log('no popup; user dialog says:', (await dlg.innerText().catch(() => '(closed)')).replace(/s+/g, ' ').slice(0, 300));
    await shot(user, 'ERR-user'); await shot(astro, 'ERR-astro'); throw e;
  }
  await shot(astro, `11-${mode}-incoming-390`);
  await pop.getByRole('button', { name: /Accept/ }).click();
  try {
    await Promise.all([user.waitForURL(/\/consult\//, { timeout: 60000, waitUntil: 'commit' }), astro.waitForURL(/\/consult\//, { timeout: 60000, waitUntil: 'commit' })]);
  } catch (e) {
    log('urls user=', user.url(), 'astro=', astro.url());
    await shot(user, 'ERR-user'); await shot(astro, 'ERR-astro');
    throw e;
  }
  log('both in room', user.url());
  return user.url().split('/consult/')[1];
}

// ---- CHAT ----
if (!process.env.ONLY_VIDEO) {
await startConsult('Chat');
await user.waitForTimeout(1500);
const ubox = user.getByLabel('Message');
await ubox.fill('Namaste Guruji, when will I get a new job?');
await ubox.press('Enter');
await astro.getByText('when will I get a new job?').waitFor({ timeout: 10000 });
log('astro received user message');
const abox = astro.getByLabel('Message');
await abox.fill('Namaste! Jupiter transit in your 10th house from May looks favourable.');
await abox.press('Enter');
await user.getByText('Jupiter transit in your 10th house').waitFor({ timeout: 10000 });
log('user received astro reply');
await shot(user, '20-chat-user-1440');
await shot(astro, '21-chat-astro-390');
log('waiting 63s for a billing tickÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦');
await astro.waitForTimeout(63000);
const astroHeader = await astro.locator('header').innerText();
const userHeader = await user.locator('header').innerText();
log('user header after tick:', userHeader.replace(/\s+/g, ' '));
await user.getByRole('button', { name: /^End$/ }).first().click();
await user.getByRole('dialog', { name: 'Rate consultation' }).waitFor({ timeout: 10000 });
await shot(user, '22-chat-ended-review');
await user.getByRole('button', { name: '5 stars' }).click();
await user.getByPlaceholder('Share a few words (optional)').fill('Very clear and kind guidance. Automated test review.');
await user.getByRole('button', { name: 'Submit' }).click();
await user.getByText('Thank you for your review!').waitFor({ timeout: 10000 });
log('review submitted');
const sysEnded = await user.getByText(/Session ended/).first().innerText();
log('system message:', sysEnded);
await shot(astro, '23-chat-ended-astro-390');
void astroHeader;

// ---- RECHARGE via test gateway ----
await user.goto(`${BASE}/wallet`, { waitUntil: 'networkidle' });
const before = await user.getByTestId('wallet-balance').innerText();
await user.getByRole('button', { name: /Proceed to pay/ }).click();
await user.waitForURL(/\/pay\//, { timeout: 30000, waitUntil: 'commit' }); await user.waitForLoadState('networkidle');
await shot(user, '30-pay-gateway-1440');
await user.getByTestId('pay-success').click();
await user.waitForURL(/\/wallet\?paid=1/, { timeout: 30000, waitUntil: 'commit' }); await user.waitForLoadState('networkidle');
const after = await user.getByTestId('wallet-balance').innerText();
log('wallet before', before, 'after', after);
await shot(user, '31-wallet-after-recharge');

} // end chat + recharge

// ---- VIDEO call ----
await astro.goto(`${BASE}/astrologer-panel`, { waitUntil: 'networkidle' });
await startConsult('Video');
const pcState = (p) => p.evaluate(() => window.__pc?.connectionState || 'none');
let us = 'none', as = 'none';
for (let i = 0; i < 30 && !(us === 'connected' && as === 'connected'); i++) {
  await user.waitForTimeout(1000);
  us = await pcState(user); as = await pcState(astro);
}
log('VIDEO peer states user=', us, 'astro=', as);
const remoteTracks = await user.evaluate(() => { const v = document.querySelector('video[data-remote]'); return v?.srcObject ? v.srcObject.getTracks().map((t) => t.kind) : []; });
log('user remote tracks', remoteTracks);
await user.waitForTimeout(1500);
const inbound = (p) => p.evaluate(async () => { const st = await window.__pc.getStats(); const o = {}; st.forEach((r) => { if (r.type === 'inbound-rtp') o[r.kind] = { bytes: r.bytesReceived, frames: r.framesDecoded, w: r.frameWidth }; }); return o; });
await user.waitForTimeout(2500);
log('user inbound', JSON.stringify(await inbound(user)), 'astro inbound', JSON.stringify(await inbound(astro)));
log('video frames user remote/local', await user.evaluate(() => [...document.querySelectorAll('video')].map((v) => v.videoWidth + 'x' + v.videoHeight)));
log('video frames astro remote/local', await astro.evaluate(() => [...document.querySelectorAll('video')].map((v) => v.videoWidth + 'x' + v.videoHeight)));
await user.waitForTimeout(1500);
await shot(user, '40-video-user-1440');
await shot(astro, '41-video-astro-390');
await astro.getByRole('button', { name: /^End$/ }).first().click();
await user.getByText('Consultation complete').waitFor({ timeout: 10000 });
log('video ended by astrologer');
await shot(user, '42-video-ended-user');

// ---- VOICE call ----
await astro.goto(BASE + '/astrologer-panel', { waitUntil: 'networkidle' });
await startConsult('Call');
let cu = 'none', ca = 'none';
for (let i = 0; i < 30 && !(cu === 'connected' && ca === 'connected'); i++) { await user.waitForTimeout(1000); cu = await pcState(user); ca = await pcState(astro); }
log('CALL peer states user=', cu, 'astro=', ca);
await shot(user, '50-call-user-1440');
await shot(astro, '51-call-astro-390');
await user.getByRole('button', { name: 'End call' }).click();
await astro.getByText('Consultation complete').waitFor({ timeout: 10000 });
log('call ended by user');

await browser.close();
log('DONE');
