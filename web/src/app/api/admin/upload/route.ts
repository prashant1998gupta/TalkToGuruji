import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { adminRoute, HttpError } from '@/components/admin/server-utils';

const MAX = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

export const POST = adminRoute(async (_admin, req: Request) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'No file uploaded.');
  if (!TYPES.includes(file.type)) throw new HttpError(400, 'Only JPG, PNG, WebP, GIF or AVIF images are allowed.');
  if (file.size > MAX) throw new HttpError(400, 'Image must be 5 MB or smaller.');

  let out: Buffer;
  try {
    // re-encoding also strips anything that is not pixel data
    out = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
  } catch {
    throw new HttpError(400, 'That file is not a readable image.');
  }
  const base = path.basename(file.name).replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || 'image';
  const name = `${base}-${randomBytes(3).toString('hex')}.webp`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), out);
  return Response.json({ ok: true, url: `/uploads/${name}` });
});
