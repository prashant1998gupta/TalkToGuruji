import { z } from 'zod';
import { cityById, cityLabel } from '@/lib/astro/cities';
import { matchCharts } from '@/lib/astro/matching';

const person = z.object({ name: z.string().trim().min(1).max(60), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/), city: z.string() });

/** JSON Gun Milan for app/API use: { boy: {...}, girl: {...} } with city ids from /api/cities. */
export async function POST(req: Request) {
  const parsed = z.object({ boy: person, girl: person }).safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: 'Please provide both birth details.' }, { status: 400 });
  const toInput = (p: z.infer<typeof person>, gender: string) => {
    const c = cityById(p.city);
    return c ? { ...p, gender, place: cityLabel(c), lat: c.lat, lon: c.lon, tz: c.tz } : null;
  };
  const b = toInput(parsed.data.boy, 'Male');
  const g = toInput(parsed.data.girl, 'Female');
  if (!b || !g) return Response.json({ error: 'Unknown birth place.' }, { status: 400 });
  return Response.json(matchCharts(b, g));
}
