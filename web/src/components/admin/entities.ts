/**
 * Field configs for the generic admin CRUD (shared by the client forms and
 * /api/admin/crud/[entity]). Pure data — safe to import on client and server.
 */

export type FieldType = 'text' | 'textarea' | 'html' | 'int' | 'paise' | 'bool' | 'select' | 'date' | 'json' | 'image' | 'images' | 'slug' | 'variants';

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
  /** slug fields: which field to derive from */
  from?: string;
  /** layout: span both columns */
  wide?: boolean;
  placeholder?: string;
};

export type Entity = {
  key: string;
  model: string; // prisma delegate name
  label: string;
  fields: Field[];
  /** columns shown in list tables */
  columns: string[];
  /** unique scope for slug fields, e.g. ['type'] for content */
  slugScope?: string[];
  orderBy?: Record<string, 'asc' | 'desc'>;
};

export const CONTENT_TYPES = ['blog', 'news', 'festival', 'vrat', 'aarti', 'bhajan', 'tarot', 'numerology', 'remedy', 'vastu', 'video', 'story', 'gallery', 'horoscope'] as const;

export const CONTENT_EXTRA_HINT: Record<string, string> = {
  video: '{"videoUrl": "https://www.youtube.com/watch?v=…"}',
  story: '{"photos": [{"src": "/m/…webp", "title": "…", "caption": "…"}]}',
  gallery: '{"photos": [{"src": "/m/…webp", "title": "…", "caption": "…"}]}',
  tarot: '{"table": "<table>…</table>"}',
  horoscope: '{"sign": "aries", "period": "weekly", "month": "July", "year": "2025", "start": null, "end": null}',
  festival: '{"tithi": "…", "paksha": "…"}',
  vrat: '{"tithi": "…", "paksha": "…"}',
};

const opts = (xs: readonly string[]) => xs.map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) }));

export const ENTITIES: Record<string, Entity> = {
  content: {
    key: 'content', model: 'content', label: 'Content', slugScope: ['type'], orderBy: { createdAt: 'desc' },
    columns: ['title', 'type', 'published'],
    fields: [
      { name: 'type', label: 'Type', type: 'select', required: true, options: opts(CONTENT_TYPES) },
      { name: 'title', label: 'Title', type: 'text', required: true, wide: true },
      { name: 'slug', label: 'Slug', type: 'slug', from: 'title', required: true },
      { name: 'category', label: 'Category', type: 'text' },
      { name: 'subtitle', label: 'Subtitle', type: 'text' },
      { name: 'author', label: 'Author', type: 'text' },
      { name: 'image', label: 'Cover image', type: 'image', wide: true },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', wide: true },
      { name: 'body', label: 'Body', type: 'html', wide: true },
      { name: 'eventDate', label: 'Event date (festival / vrat)', type: 'date' },
      { name: 'published', label: 'Published', type: 'bool' },
      { name: 'extra', label: 'Extra data (JSON)', type: 'json', wide: true },
      { name: 'metaTitle', label: 'Meta title', type: 'text', wide: true },
      { name: 'metaDesc', label: 'Meta description', type: 'textarea', wide: true },
    ],
  },
  puja: {
    key: 'puja', model: 'puja', label: 'Puja', orderBy: { createdAt: 'desc' },
    columns: ['name', 'price', 'tier', 'active'],
    fields: [
      { name: 'name', label: 'Puja name', type: 'text', required: true, wide: true },
      { name: 'slug', label: 'Slug', type: 'slug', from: 'name', required: true },
      { name: 'tier', label: 'Tier', type: 'select', options: [{ value: 'standard', label: 'Standard' }, { value: 'vip', label: 'VIP' }] },
      { name: 'price', label: 'Price (₹)', type: 'int', required: true },
      { name: 'mrp', label: 'MRP before discount (₹)', type: 'int', required: true },
      { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g. 2–3 hours' },
      { name: 'active', label: 'Active', type: 'bool' },
      { name: 'image', label: 'Image', type: 'image', wide: true },
      { name: 'excerpt', label: 'Short description', type: 'textarea', wide: true },
      { name: 'summary', label: 'Summary (HTML)', type: 'html', wide: true },
      { name: 'body', label: 'Full description (HTML)', type: 'html', wide: true },
      { name: 'metaTitle', label: 'Meta title', type: 'text', wide: true },
      { name: 'metaDesc', label: 'Meta description', type: 'textarea', wide: true },
    ],
  },
  product: {
    key: 'product', model: 'product', label: 'Product', orderBy: { createdAt: 'desc' },
    columns: ['name', 'price', 'stock', 'active'],
    fields: [
      { name: 'name', label: 'Product name', type: 'text', required: true, wide: true },
      { name: 'slug', label: 'Slug', type: 'slug', from: 'name', required: true },
      { name: 'categoryId', label: 'Category', type: 'select', required: true, options: [] },
      { name: 'price', label: 'Price (₹)', type: 'int', required: true },
      { name: 'mrp', label: 'MRP (₹)', type: 'int', required: true },
      { name: 'stock', label: 'Stock', type: 'int' },
      { name: 'origin', label: 'Origin', type: 'text' },
      { name: 'featured', label: 'Featured', type: 'bool' },
      { name: 'active', label: 'Active', type: 'bool' },
      { name: 'images', label: 'Images', type: 'images', wide: true },
      { name: 'variants', label: 'Variants (e.g. carat sizes)', type: 'variants', wide: true },
      { name: 'excerpt', label: 'Short description', type: 'textarea', wide: true },
      { name: 'summary', label: 'Benefits / summary (HTML)', type: 'html', wide: true },
      { name: 'body', label: 'Description (HTML)', type: 'html', wide: true },
    ],
  },
  productCategory: {
    key: 'productCategory', model: 'productCategory', label: 'Category', orderBy: { name: 'asc' },
    columns: ['name', 'slug'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'slug', from: 'name', required: true },
      { name: 'image', label: 'Image', type: 'image', wide: true },
      { name: 'description', label: 'Description', type: 'textarea', wide: true },
    ],
  },
  rechargePack: {
    key: 'rechargePack', model: 'rechargePack', label: 'Recharge pack', orderBy: { sort: 'asc' },
    columns: ['amount', 'bonus', 'popular', 'sort'],
    fields: [
      { name: 'amount', label: 'Amount (₹)', type: 'int', required: true },
      { name: 'bonus', label: 'Bonus %', type: 'int' },
      { name: 'popular', label: 'Mark as popular', type: 'bool' },
      { name: 'sort', label: 'Sort order', type: 'int' },
    ],
  },
  faq: {
    key: 'faq', model: 'faq', label: 'FAQ', orderBy: { sort: 'asc' },
    columns: ['sort', 'question'],
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, wide: true },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true, wide: true },
      { name: 'sort', label: 'Sort order', type: 'int' },
    ],
  },
  testimonial: {
    key: 'testimonial', model: 'testimonial', label: 'Testimonial', orderBy: { createdAt: 'asc' },
    columns: ['name', 'profession', 'rating'],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'profession', label: 'Profession', type: 'text' },
      { name: 'rating', label: 'Rating (1–5)', type: 'int' },
      { name: 'body', label: 'Testimonial', type: 'textarea', required: true, wide: true },
    ],
  },
  banner: {
    key: 'banner', model: 'banner', label: 'Banner', orderBy: { sort: 'asc' },
    columns: ['image', 'title', 'link', 'active'],
    fields: [
      { name: 'image', label: 'Image', type: 'image', required: true, wide: true },
      { name: 'title', label: 'Title', type: 'text' },
      { name: 'link', label: 'Link', type: 'text', placeholder: '/blogs/…' },
      { name: 'sort', label: 'Sort order', type: 'int' },
      { name: 'active', label: 'Active', type: 'bool' },
    ],
  },
  page: {
    key: 'page', model: 'page', label: 'Page', orderBy: { slug: 'asc' },
    columns: ['title', 'slug'],
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'slug', from: 'title', required: true },
      { name: 'body', label: 'Content', type: 'html', required: true, wide: true },
    ],
  },
};

export const HOROSCOPE_FIELDS = ['personal', 'profession', 'love', 'luck', 'health', 'travel', 'emotions'] as const;

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Turn a DB row into form state (JSON columns → structures, dates → yyyy-mm-dd). */
export function toFormValues(fields: Field[], row: Record<string, unknown> | null) {
  const v: Record<string, any> = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
  for (const f of fields) {
    const raw = row?.[f.name];
    if (f.type === 'images' || f.type === 'variants') {
      try { v[f.name] = raw ? JSON.parse(String(raw)) : []; } catch { v[f.name] = []; }
    } else if (f.type === 'json') {
      try { v[f.name] = raw ? JSON.stringify(JSON.parse(String(raw)), null, 2) : ''; } catch { v[f.name] = String(raw || ''); }
    } else if (f.type === 'date') {
      v[f.name] = raw ? new Date(raw as string).toISOString().slice(0, 10) : '';
    } else if (f.type === 'bool') {
      v[f.name] = row ? !!raw : true;
    } else {
      v[f.name] = raw ?? '';
    }
  }
  return v;
}

