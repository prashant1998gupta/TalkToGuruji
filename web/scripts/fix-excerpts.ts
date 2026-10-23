// One-off: rebuild content excerpts from paragraph text (matches the seed logic) without reseeding.
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const text = (html: string, n = 220) => {
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1]).join(' ');
  const src = paras.replace(/<[^>]+>/g, '').trim().length > 40 ? paras : html;
  const t = src.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).replace(/\s\S*$/, '') + '…' : t;
};

(async () => {
  const rows = await db.content.findMany({ where: { type: { notIn: ['story', 'gallery'] } }, select: { id: true, body: true } });
  for (const r of rows) if (r.body) await db.content.update({ where: { id: r.id }, data: { excerpt: text(r.body) } });
  console.log('updated', rows.length);
  await db.$disconnect();
})();
