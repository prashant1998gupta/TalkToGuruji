import sanitizeHtml from 'sanitize-html';
import { Prisma } from '@prisma/client';
import { apiUser, type CurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { ENTITIES, slugify, type Entity } from './entities';

/** Same allow-list as prisma/seed.ts so admin-edited HTML matches imported HTML. */
export function cleanHtml(html: string) {
  return sanitizeHtml(html || '', {
    allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'span', 'div', 'figure', 'figcaption', 'iframe'],
    allowedAttributes: { a: ['href', 'target', 'rel'], img: ['src', 'alt'], iframe: ['src', 'allowfullscreen'], td: ['colspan', 'rowspan'], th: ['colspan', 'rowspan'] },
    allowedIframeHostnames: ['www.youtube.com', 'youtube.com'],
    transformTags: { h1: 'h2', b: 'strong' },
  }).trim();
}

/** Wraps an admin route handler: auth check + uniform error responses. */
export function adminRoute<A extends unknown[]>(fn: (admin: CurrentUser, ...args: A) => Promise<Response>) {
  return async (...args: A) => {
    const admin = await apiUser(['ADMIN']);
    if (admin instanceof Response) return admin;
    try {
      return await fn(admin, ...args);
    } catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return Response.json({ error: 'That slug / value is already in use.' }, { status: 409 });
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return Response.json({ error: 'Record not found.' }, { status: 404 });
      console.error('[admin]', e);
      return Response.json({ error: 'Something went wrong.' }, { status: 500 });
    }
  };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const body = async (req: Request) => {
  try { return (await req.json()) as Record<string, unknown>; } catch { throw new HttpError(400, 'Invalid JSON body.'); }
};

export function entityOr404(key: string): Entity {
  const e = ENTITIES[key];
  if (!e) throw new HttpError(404, 'Unknown entity.');
  return e;
}

/** Coerce + validate incoming form values according to the entity's field config. */
export function coerce(entity: Entity, input: Record<string, unknown>, partial: boolean) {
  const data: Record<string, unknown> = {};
  for (const f of entity.fields) {
    if (!(f.name in input)) {
      if (!partial && f.required && f.type !== 'slug') throw new HttpError(400, `${f.label} is required.`);
      continue;
    }
    const v = input[f.name];
    const empty = v === '' || v === null || v === undefined;
    if (empty && f.required && f.type !== 'slug') throw new HttpError(400, `${f.label} is required.`);
    switch (f.type) {
      case 'int': {
        if (empty) { data[f.name] = f.required ? 0 : undefined; break; }
        const n = Number(v);
        if (!Number.isFinite(n)) throw new HttpError(400, `${f.label} must be a number.`);
        data[f.name] = Math.round(n);
        break;
      }
      case 'paise': data[f.name] = Math.round(Number(v || 0) * 100); break;
      case 'bool': data[f.name] = v === true || v === 'true' || v === 'on'; break;
      case 'date': data[f.name] = empty ? null : new Date(String(v)); break;
      case 'html': data[f.name] = cleanHtml(String(v ?? '')); break;
      case 'slug': data[f.name] = slugify(String(v || input[f.from || 'title'] || '')); break;
      case 'json': {
        if (empty) { data[f.name] = null; break; }
        const s = typeof v === 'string' ? v : JSON.stringify(v);
        try { JSON.parse(s); } catch { throw new HttpError(400, `${f.label} is not valid JSON.`); }
        data[f.name] = s;
        break;
      }
      case 'images': {
        const arr = Array.isArray(v) ? v : [];
        data[f.name] = JSON.stringify(arr.map(String).filter(Boolean));
        break;
      }
      case 'variants': {
        const arr = (Array.isArray(v) ? v : []) as { label?: unknown; price?: unknown; mrp?: unknown }[];
        data[f.name] = JSON.stringify(arr.filter((x) => x && x.label).map((x) => ({ label: String(x.label), price: Math.round(Number(x.price) || 0), mrp: Math.round(Number(x.mrp) || Number(x.price) || 0) })));
        break;
      }
      default: data[f.name] = empty ? (f.required ? '' : null) : String(v).trim();
    }
    if (data[f.name] === undefined) delete data[f.name];
  }
  // Fields that are non-null strings in the schema must not be nulled out
  for (const k of ['excerpt', 'summary', 'body', 'description']) if (data[k] === null) data[k] = '';
  return data;
}

export const delegate = (model: string) => (db as unknown as Record<string, any>)[model]; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Recompute an astrologer's average rating from visible reviews. */
export async function recomputeRating(astrologerId: string) {
  const agg = await db.review.aggregate({ where: { astrologerId, hidden: false }, _avg: { rating: true }, _count: true });
  await db.astrologer.update({ where: { id: astrologerId }, data: { rating: Math.round((agg._avg.rating || 0) * 10) / 10, ratingCount: agg._count } });
}
