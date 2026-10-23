import { db } from '@/lib/db';
import { json } from '@/lib/format';

export type Variant = { label: string; price: number; mrp: number };
export type CartLine = { id: string; productId: string; slug: string; name: string; image: string | null; variant: string; price: number; mrp: number; qty: number; stock: number };

export const productImages = (images: string) => json<string[]>(images, []);
export const productVariants = (variants: string) => json<Variant[]>(variants, []);

/** Price (rupees) for a product + variant label; null when the variant doesn't exist. */
export function priceFor(p: { price: number; mrp: number; variants: string }, variant: string) {
  const vs = productVariants(p.variants);
  if (!vs.length) return variant ? null : { price: p.price, mrp: p.mrp };
  const v = vs.find((x) => x.label === variant);
  return v ? { price: v.price, mrp: v.mrp } : null;
}

/** Cart lines with live prices; drops items whose product/variant disappeared. */
export async function loadCart(userId: string) {
  const items = await db.cartItem.findMany({ where: { userId }, orderBy: { id: 'asc' } });
  const products = await db.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, active: true } });
  const lines: CartLine[] = [];
  for (const i of items) {
    const p = products.find((x) => x.id === i.productId);
    const pr = p && priceFor(p, i.variant);
    if (!p || !pr) continue;
    lines.push({ id: i.id, productId: p.id, slug: p.slug, name: p.name, image: productImages(p.images)[0] ?? null, variant: i.variant, price: pr.price, mrp: pr.mrp, qty: i.qty, stock: p.stock });
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const mrpTotal = lines.reduce((s, l) => s + l.mrp * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 79;
  return { lines, subtotal, mrpTotal, shipping, total: subtotal + shipping, count: lines.reduce((s, l) => s + l.qty, 0) };
}
