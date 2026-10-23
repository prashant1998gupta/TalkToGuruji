import { z } from 'zod';
import { apiUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { cityById, cityLabel } from '@/lib/astro/cities';
import { computeKundli } from '@/lib/astro/kundli';

export async function GET() {
  const u = await apiUser();
  if (u instanceof Response) return u;
  const kundlis = await db.kundli.findMany({ where: { userId: u.id }, orderBy: { createdAt: 'desc' } });
  return Response.json({ kundlis });
}

const schema = z.object({
  name: z.string().trim().min(1).max(60),
  gender: z.enum(['Male', 'Female', 'Other']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  city: z.string(),
});

/** Save a kundli for the logged-in user. Also usable as a stateless calculator via ?compute=1. */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please fill all birth details.' }, { status: 400 });
  const city = cityById(parsed.data.city);
  if (!city) return Response.json({ error: 'Please choose a birth place from the list.' }, { status: 400 });
  const input = { ...parsed.data, place: cityLabel(city), lat: city.lat, lon: city.lon, tz: city.tz };

  if (new URL(req.url).searchParams.get('compute')) return Response.json({ kundli: computeKundli(input) });

  const u = await apiUser();
  if (u instanceof Response) return u;
  const k = await db.kundli.create({
    data: { userId: u.id, name: input.name, gender: input.gender, birthDate: input.date, birthTime: input.time, place: input.place, lat: input.lat, lon: input.lon, tz: input.tz },
  });
  return Response.json({ ok: true, id: k.id });
}
