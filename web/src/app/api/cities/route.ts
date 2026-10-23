import { searchCities, cityLabel } from '@/lib/astro/cities';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') || '';
  const cities = searchCities(q, 8).map((c) => ({ id: c.id, label: cityLabel(c), tz: c.tz }));
  return Response.json({ cities }, { headers: { 'cache-control': 'public, max-age=86400' } });
}
