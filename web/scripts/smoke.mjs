// Smoke test: fetch every sitemap URL plus app-only routes and report non-200 responses.
const BASE = process.env.BASE || 'http://localhost:3000';
const extra = ['/login', '/astrology-services/Panchang', '/astrology-services/video-consultation', '/astrology-services/live-astrologers', '/transits', '/cart', '/no-such-page'];

const xml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const all = [...new Set([...urls, ...extra])];
console.log('checking', all.length, 'urls');

const bad = [];
let i = 0;
async function worker() {
  while (i < all.length) {
    const p = all[i++];
    const t = Date.now();
    try {
      const r = await fetch(BASE + p, { redirect: 'manual' });
      const ok = r.status === 200 || (r.status >= 300 && r.status < 400) || (p === '/no-such-page' && r.status === 404);
      if (!ok) bad.push(`${r.status} ${p}`);
      if (Date.now() - t > 8000) console.log('slow', Date.now() - t, 'ms', p);
    } catch (e) { bad.push(`ERR ${p} ${e.message}`); }
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
console.log(bad.length ? 'FAILURES:\n' + bad.join('\n') : 'all ok');
