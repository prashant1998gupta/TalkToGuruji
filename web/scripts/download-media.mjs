// One-off: download every image the old site's content references into public/media.
import fs from 'node:fs/promises';
import path from 'node:path';

const SRC = '../_source';
const OUT = 'public/media';
await fs.mkdir(OUT, { recursive: true });

const urls = new Set();
for (const dir of ['api', 'pages']) {
  for (const f of await fs.readdir(path.join(SRC, dir))) {
    const txt = await fs.readFile(path.join(SRC, dir, f), 'utf8');
    for (const m of txt.matchAll(/https?:\/\/(?:www\.)?talktoguruji\.com\/upload\/[^"'\\<>]+?\.(?:png|jpe?g|webp|gif|svg|avif|mp4|mp3)/gi)) urls.add(m[0]);
    for (const m of txt.matchAll(/"(\/?upload\/file\/[^"\\]+)"/g)) urls.add('https://talktoguruji.com/' + m[1].replace(/^\//, ''));
  }
}

export const toLocal = (u) => {
  const name = decodeURIComponent(u.split('/').pop()).replace(/[^a-zA-Z0-9._-]+/g, '_').toLowerCase();
  return name;
};

const map = {};
const list = [...urls];
let ok = 0, fail = 0;
async function worker() {
  while (list.length) {
    const u = list.shift();
    const name = toLocal(u);
    map[u] = `/media/${name}`;
    const file = path.join(OUT, name);
    try {
      await fs.access(file); ok++; continue;
    } catch {}
    try {
      const r = await fetch(encodeURI(decodeURI(u)), { headers: { 'user-agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error(r.status);
      await fs.writeFile(file, Buffer.from(await r.arrayBuffer()));
      ok++;
    } catch (e) { fail++; delete map[u]; console.log('fail', u, e.message); }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
await fs.writeFile(path.join(SRC, 'media-map.json'), JSON.stringify(map, null, 1));
console.log('urls', urls.size, 'ok', ok, 'fail', fail);
