import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { loadCart, priceFor } from '@/components/commerce/cart';

export const dynamic = 'force-dynamic';

export async function GET() {
  const u = await apiUser();
  if (u instanceof Response) return Response.json({ lines: [], subtotal: 0, mrpTotal: 0, shipping: 0, total: 0, count: 0 });
  return Response.json(await loadCart(u.id));
}

const addSchema = z.object({ productId: z.string().min(1), variant: z.string().default(''), qty: z.number().int().min(1).max(10).default(1), replace: z.boolean().optional() });

export async function POST(req: Request) {
  const u = await apiUser(['USER']);
  if (u instanceof Response) return u;
  const parsed = addSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Invalid item.' }, { status: 400 });
  const { productId, variant, qty, replace } = parsed.data;
  const p = await db.product.findUnique({ where: { id: productId } });
  if (!p || !p.active) return Response.json({ error: 'Product not available.' }, { status: 404 });
  if (!priceFor(p, variant)) return Response.json({ error: 'Please choose an option.' }, { status: 400 });
  const existing = await db.cartItem.findUnique({ where: { userId_productId_variant: { userId: u.id, productId, variant } } });
  const next = Math.min(10, Math.min(p.stock, replace ? qty : (existing?.qty ?? 0) + qty));
  if (next < 1) return Response.json({ error: 'Out of stock.' }, { status: 409 });
  await db.cartItem.upsert({ where: { userId_productId_variant: { userId: u.id, productId, variant } }, update: { qty: next }, create: { userId: u.id, productId, variant, qty: next } });
  return Response.json(await loadCart(u.id));
}

export async function PATCH(req: Request) {
  const u = await apiUser(['USER']);
  if (u instanceof Response) return u;
  const parsed = z.object({ id: z.string(), qty: z.number().int().min(0).max(10) }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Invalid quantity.' }, { status: 400 });
  const { id, qty } = parsed.data;
  if (qty === 0) await db.cartItem.deleteMany({ where: { id, userId: u.id } });
  else await db.cartItem.updateMany({ where: { id, userId: u.id }, data: { qty } });
  return Response.json(await loadCart(u.id));
}

export async function DELETE(req: Request) {
  const u = await apiUser(['USER']);
  if (u instanceof Response) return u;
  const id = new URL(req.url).searchParams.get('id');
  if (id) await db.cartItem.deleteMany({ where: { id, userId: u.id } });
  return Response.json(await loadCart(u.id));
}
