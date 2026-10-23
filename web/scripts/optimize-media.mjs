// One-off: convert downloaded media to compact WebP (max 1600px) in public/m and rewrite the map.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'public/media';
const OUT = 'public/m';
const mapFile = '../_source/media-map.json';
await fs.mkdir(OUT, { recursive: true });

const map = JSON.parse(await fs.readFile(mapFile, 'utf8'));
const out = {};
let before = 0, after = 0;
for (const [url, local] of Object.entries(map)) {
  const file = path.join(SRC, path.basename(local));
  const name = path.basename(local).replace(/\.[a-z0-9]+$/i, '') + '.webp';
  try {
    const buf = await fs.readFile(file);
    before += buf.length;
    const img = sharp(buf, { animated: false }).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 78 });
    const res = await img.toBuffer();
    await fs.writeFile(path.join(OUT, name), res);
    after += res.length;
    out[url] = `/m/${name}`;
  } catch (e) { console.log('skip', local, e.message); }
}
await fs.writeFile(mapFile, JSON.stringify(out, null, 1));
await fs.rm(SRC, { recursive: true, force: true });
console.log('files', Object.keys(out).length, 'MB', (before / 1e6).toFixed(1), '->', (after / 1e6).toFixed(1));
